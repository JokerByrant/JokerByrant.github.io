---
title: Java 对接微信支付
abbrlink: 32349
date: 2024-10-17 09:11:53
tags: 支付
categories: 后端技术
---

本文简单总结一下 Java 中 SpringBoot 对接微信支付需要做的一些工作。

<!--more-->

### 准备工作

在对接微信支付时，可以使用微信提供的 SDK 进行对接：[使用 Java SDK 快速开始](https://pay.weixin.qq.com/docs/merchant/sdk-tools/quickstart-java.html)

其中需要进行一些必要的配置，如下：

![picture 0](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/4195029a9967552d8a849ce41f6cc0cdce0e3c0d157a6aa4486496ef7aeb5c85.jpg)  

具体要做的工作有如下3个：

1. **生成商户 API 证书**。生成方法：[商户API证书获取方法及功能介绍](https://kf.qq.com/faq/161222NneAJf161222U7fARv.html)
2. **商户 API 证书生成之后，拿到证书序列号**。获取方法：[证书相关问题](https://pay.weixin.qq.com/docs/merchant/development/interface-rules/certificate-faqs.html)
3. **配置 APIv3 密钥**。配置方法：[API v3密钥](https://pay.weixin.qq.com/docs/merchant/development/interface-rules/apiv3key.html)

### 服务端获取微信支付请求串

App 端在调起微信支付前，需要先请求服务端拿到交易ID信息，之后还需要组装一个请求串，组装请求串时涉及加签操作，需要用到微信支付私钥，出于安全考虑，这个组装请求的操作最好在服务端处理。可以直接将这两个步骤合并，**App 端请求服务端获取支付请求串**，完整代码如下：

```java
/**
 * 微信支付工具类
 * https://pay.weixin.qq.com/docs/merchant/sdk-tools/quickstart-java.html
 * @author sxh
 * @date 2024/10/9
 */
@Component
public class WeChatPayUtil {
    @Autowired
    private WeChatPayProperties weChatPayProperties;
    private static WeChatPayProperties staticWeChatPayProperties;
    private static Config config;

    private static final Logger logger = LoggerFactory.getLogger(WeChatPayUtil.class);

    @PostConstruct
    public void init() {
        staticWeChatPayProperties = weChatPayProperties;
        config = new RSAAutoCertificateConfig.Builder()
                        .merchantId(staticWeChatPayProperties.getMerchantId())
                        .privateKeyFromPath(staticWeChatPayProperties.getPrivateKeyPath())
                        .merchantSerialNumber(staticWeChatPayProperties.getMerchantSerialNumber())
                        .apiV3Key(staticWeChatPayProperties.getApiV3key())
                        .build();
    }

    /**
     * 发起App支付（返回组装好的信息，App端可以根据组装后的信息直接发起支付请求）
     * https://pay.weixin.qq.com/docs/merchant/apis/in-app-payment/direct-jsons/app-prepay.html
     * @param payWater
     * @param money
     * @param subject
     * @return
     */
    public static String requestAppApy(String payWater, BigDecimal money, String subject) {
        AppService appService = new AppService.Builder().config(config).build();
        PrepayRequest request = new PrepayRequest();
        Amount amount = new Amount();
        // 支付金额(分)
        amount.setTotal(money.multiply(new BigDecimal(100)).intValue());
        amount.setCurrency("CNY");
        request.setAmount(amount);
        request.setAppid(staticWeChatPayProperties.getAppID());
        request.setMchid(staticWeChatPayProperties.getMerchantId());
        request.setDescription(subject);
        request.setNotifyUrl(staticWeChatPayProperties.getNotifyUrl());
        request.setOutTradeNo(payWater);
        PrepayResponse response = appService.prepay(request);
        logger.info("发起微信支付返回结果：{}", response.getPrepayId());
        return getAppPayInfo(response.getPrepayId());
    }

    /**
     * 组装App调起支付需要的请求串
     * https://pay.weixin.qq.com/docs/merchant/apis/in-app-payment/app-transfer-payment.html
     * @param prepayid
     * @return
     */
    private static String getAppPayInfo(String prepayid) {
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("appid", staticWeChatPayProperties.getAppID());
        jsonObject.put("prepayid", prepayid);
        jsonObject.put("noncestr", UuidUtil.getUid());
        jsonObject.put("timestamp", System.currentTimeMillis() / 1000);
        jsonObject.put("partnerid", staticWeChatPayProperties.getMerchantId());
        jsonObject.put("package", "Sign=WXPay");
        jsonObject.put("sign", generateSignature(jsonObject));
        return jsonObject.toJSONString();
    }

    /**
     * 生成签名
     * https://pay.weixin.qq.com/docs/merchant/development/interface-rules/signature-generation.html
     * @param jsonObject
     * @return
     */
    private static String generateSignature(JSONObject jsonObject) {
        String str = jsonObject.getString("appid") + "\n" + jsonObject.getString("timestamp") + "\n" + jsonObject.getString("noncestr") + "\n" + jsonObject.getString("prepayid");
        try {
            Signature sign = Signature.getInstance("SHA256withRSA");
            sign.initSign(getPrivateKey());
            sign.update(str.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(sign.sign());
        } catch (Exception e) {
            throw new RuntimeException("签名生成失败！", e);
        }
    }

    /**
     * 读取私钥证书
     * @return
     * @throws Exception
     */
    private static PrivateKey getPrivateKey() throws Exception {
        String content = new String(Files.readAllBytes(Paths.get(staticWeChatPayProperties.getPrivateKeyPath())), StandardCharsets.UTF_8);
        String privateKey = content.replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s+", "");
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateKey)));
    }
}
```

关于签名的生成方法参考微信官方文档中的这两个指引：

1. [如何生成请求签名 - 微信支付文档](https://pay.weixin.qq.com/docs/merchant/development/interface-rules/signature-generation.html)
2. [如何在程序中加载私钥 - 微信支付文档](https://pay.weixin.qq.com/docs/merchant/development/interface-rules/signature-faqs.html)

### 处理微信支付回调

微信支付文档只给了处理回调的步骤，并没有给出具体的代码案例。在 [SpringBoot+微信支付-JSAPI{微信支付回调} ](https://www.cnblogs.com/gtnotgod/p/18232453) 这篇文档中给出了一个案例，在这个案例的基础上进行了处理，完整代码如下：

```java
@RequestMapping("/api/aliReturnPay")
@RestController
public class PayReturnController {
  @Autowired
  private WeChatPayReturnManager weChatPayReturnManager;
  
  /**
   * 微信支付-服务器异步通知
   * https://pay.weixin.qq.com/docs/merchant/apis/in-app-payment/payment-notice.html
   */
  @PostMapping("/returnPayAsynchronousFromWeChatPay")
  public Map<String, Object> returnPayAsynchronousFromWeChatPay(HttpServletResponse response, HttpServletRequest request) throws IOException  {
      boolean dealResult = weChatPayReturnManager.dealAsyncResultFromWeChatPay(request);
      // 返回的应答不是SUCCESS，微信会按照特定的重试策略重新投递结果，间隔频率是：15s/15s/30s/3m/10m/20m/30m/30m/30m/60m/3h/3h/3h/6h/6h - 总计 24h4m
      Map<String, Object> map = new HashMap<>();
      map.put("code", dealResult ? "SUCCESS" : "FAIL");
      return map;
  }
}
```

```java
/**
 * 微信支付回调处理Manager
 * @author sxh
 * @date 2024/10/9
 */
@Component
public class WeChatPayReturnManager {
    @Autowired
    private IPayReturnService payReturnService;

    private final Logger logger = LoggerFactory.getLogger(WeChatPayReturnManager.class);

    /**
     * 验签并处理来自微信支付回调的异步请求
     * https://www.cnblogs.com/gtnotgod/p/18232453
     * @param request
     * @return true->给微信返回true响应；false->给微信返回false响应，之后微信会重新投递
     */
    public boolean dealAsyncResultFromWeChatPay(HttpServletRequest request) {
        String notifyBody = getWechatPayNotifyBody(request);
        logger.info("收到来自微信支付的回调请求: {}", notifyBody);
        if (StringUtils.isBlank(notifyBody)) {
            logger.error("非法请求！");
            return false;
        }
        RequestParam notifyHeader = getWechatPayNotifyHeader(request, notifyBody);
        // 开始验签，验签成功返回具体的通知回调信息。如果验签失败，SDK 会抛出 ValidationException。
        NotificationParser notificationParser = new NotificationParser(WeChatPayUtil.getConfigInst());
        Transaction transaction = null;
        try {
            transaction = notificationParser.parse(notifyHeader, Transaction.class);
        } catch (ValidationException e) {
            logger.error("验签失败！", e);
            return false;
        }
        logger.info("验签成功！订单状态：{}，订单完整信息：{}", transaction.getTradeState(), JSON.toJSONString(transaction));
        // 只有状态为Success的订单才需要处理
        if (Transaction.TradeStateEnum.SUCCESS.equals(transaction.getTradeState())) {
            return payReturnService.updateForSpecificLogic(transaction.getOutTradeNo(), null);
        }
        return true;
    }

    /**
     * 获取微信支付回调结果
     * @param request
     * @return
     */
    private String getWechatPayNotifyBody(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        } catch (IOException e) {
            logger.error("微信支付回调结果获取失败！", e);
            return null;
        }
        return sb.toString();
    }

    /**
     * 获取微信支付回调中的Header
     * @param request
     * @param notifyBody
     * @return
     */
    private RequestParam getWechatPayNotifyHeader(HttpServletRequest request, String notifyBody) {
        // 签名中的时间戳
        String timestamp = request.getHeader(Constant.WECHAT_PAY_TIMESTAMP);
        // 签名中的随机数
        String nonce = request.getHeader(Constant.WECHAT_PAY_NONCE);
        // 签名类型
        String signType = request.getHeader("Wechatpay-Signature-Type");
        // 微信支付平台证书的序列号，验签必须使用序列号对应的微信支付平台证书
        String serialNo = request.getHeader(Constant.WECHAT_PAY_SERIAL);
        // 微信支付签名
        String signature = request.getHeader(Constant.WECHAT_PAY_SIGNATURE);
        // 若未设置signType，默认值为 WECHATPAY2-SHA256-RSA2048
        return new RequestParam.Builder()
                .serialNumber(serialNo)
                .nonce(nonce)
                .signature(signature)
                .timestamp(timestamp)
                .signType(signType)
                .body(notifyBody)
                .build();
    }
}
```

### 总结

微信支付提供的文档并不是很完善，并没有提供比较完善的 Demo 供开发者对接，对比支付宝的对接文档差了很多。

### 参考文档

[APP下单 - 微信支付文档](https://pay.weixin.qq.com/docs/merchant/apis/in-app-payment/direct-jsons/app-prepay.html)

[APP调起支付 - 微信支付文档](https://pay.weixin.qq.com/docs/merchant/apis/in-app-payment/direct-jsons/app-prepay.html)

[如何生成请求签名 - 微信支付文档](https://pay.weixin.qq.com/docs/merchant/development/interface-rules/signature-generation.html)

[如何在程序中加载私钥 - 微信支付文档](https://pay.weixin.qq.com/docs/merchant/development/interface-rules/signature-faqs.html)

[APP调起支付签名 - 微信支付文档](https://pay.weixin.qq.com/docs/merchant/development/generate-turitup-signature-verification/app-transfer-payment-signature.html)

[支付回调和查单实现指引 - 微信支付文档](https://pay.weixin.qq.com/docs/merchant/development/practices/callback-and-query-order.html)

[SpringBoot+微信支付-JSAPI{微信支付回调} ](https://www.cnblogs.com/gtnotgod/p/18232453)
