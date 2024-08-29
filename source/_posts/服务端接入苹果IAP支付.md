---
title: 服务端接入苹果IAP支付
abbrlink: 40868
date: 2024-08-17 13:41:00
tags: IAP支付
categories: 后端技术
---

最近在着手 APP 上架 App Store 的事儿，苹果要求 App 内的支付功能要对接 IAP 支付，本篇文章就记录一下对接过程中踩过的坑。

<!--more-->

### 方案调查

`App` 端支付成功后，苹果服务器会直接返回支付结果给 `App` 端，这时 `App` 端需要根据拿到的支付结果请求服务端，服务端 **请求苹果服务器验证支付结果的有效性**。

调查发现 **服务端验证支付结果的有效性** 有下面几种方式可以使用：

1. **服务端验证 `receipt`。**
   
   `App` 支付成功，拿到苹果服务器返回的 `receipt` 数据，请求服务端，服务端根据 `Receipt` 进行验证。
   
   网上的大部分处理方案都是这种，但这种方式已被标记为 `Deprecated`。
   
   文档地址：[appstorereceipts](https://developer.apple.com/documentation/appstorereceipts)
2. **服务端请求 `App Store Server Api` 验证 `TransactionId`。**
   
   `App` 支付成功，拿到苹果服务器返回的 `TransactionId` 数据，请求服务端，服务端请求 `App Store Server API` 获取具体的交易结果。
   
   文档地址：[appstoreserverapi](https://developer.apple.com/documentation/appstoreserverapi)
3. **等待 `Apple` 服务器的异步回调。**
   
   预想的是 `App` 支付成功，无需再请求服务端，服务端等待 `Apple` 服务器的异步回调(与 **支付宝支付、微信支付** 的处理一样)。
   
   但在和 `App` 端对接时，发现这种方式不可行。`Apple` 服务器回调的支付信息，只携带了 `Apple` 内定义的交易号(`TransactionId`)，服务端收到这个回调，无法确定属于哪一个订单。因此 `App` 支付成功后，必须请求服务端，服务端将苹果返回的 `TransactionId` 和订单绑定。
   
   文档地址：[app_store_server_notifications_v2](https://developer.apple.com/documentation/appstoreservernotifications/app_store_server_notifications_v2)

因此最终有如下几种处理方式：

1. `App` 拿到苹果支付成功的回调后，请求服务端，服务端进行支付结果校验，校验通过，直接处理后续发放权益的逻辑。
2. `App` 拿到苹果支付成功的回调后，请求服务端，服务端进行支付结果校验，将 `TransactionId` 和订单ID绑定。发放权益的逻辑在收到苹果支付回调后再处理。

### 根据 `Receipt` 进行验证

[App Store Receipts](https://developer.apple.com/documentation/appstorereceipts)

首先是根据 `Receipt` 进行验证，`Receipt` 是 `App` 支付成功后由苹果服务器返回的，服务端拿到 `Receipt` 请求 `verifyReceipt` 接口：[verifyReceipt - 官方文档](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt)。

相关的代码如下：

```java
@Api(tags = "001 苹果支付", description = "ApplePayController")
@RestController
@RequestMapping("applePay")
public class ApplePayController extends BaseController {

    // 购买凭证验证地址(真实环境)
    private static final String certificateUrl = "https://buy.itunes.apple.com/verifyReceipt";
    // 购买凭证验证地址(沙箱环境)
    private static final String certificateUrlTest = "https://sandbox.itunes.apple.com/verifyReceipt";

    private static final Logger log = LoggerFactory.getLogger(ApplePayController.class);

    /**
     * 验证App苹果支付成功后返回的结果
     *
     * @param receipt 支付成功后苹果返回的支付结果
     * @param envType 区分真实环境和沙箱环境 0:真实环境 1:沙箱环境
     */
    @PostMapping("/verifyApplePayResult")
    @ApiImplicitParams({
            @ApiImplicitParam(paramType="header", name = "authorization", value = "token", required = true, dataType = "String"),
            @ApiImplicitParam(paramType="query", name = "receipt", value = "苹果传递前端支付成功的值", required = true, dataType = "String"),
            @ApiImplicitParam(paramType="query", name = "envType", value = "默认0 0:真实环境 1:沙箱环境", required = true, dataType = "int")
    })
    @LogAnnotation(actionname = "苹果支付结果验证",module = "苹果支付",actiontype = "POST")
    public ResponseMessage verifyApplePayResult(@RequestParam String receipt, @RequestParam int envType) {
        log.info("开始验证苹果支付结果：{}", receipt);
        String url = (envType == 0) ? certificateUrl : certificateUrlTest;
        Object object = doVerifyApplePayResult(url, receipt);
        return new ResponseMessage("处理成功！", object);
    }

    /**
     * 向苹果服务器发送请求，验证App端提交的支付结果是否有效
     *
     * @param url receipt验证地址
     * @param receipt
     * @return 苹果响应的请求结果
     */
    private Object doVerifyApplePayResult(String url, String receipt) {
        try {
            // 向苹果服务器发送请求
            String result = sendRequestToAppleServer(url, receipt);
            // 处理苹果响应的结果
            log.info("苹果服务器回调响应：{}", result);
            JSONObject appleResponse = JSONObject.parseObject(result);
            String status = appleResponse.getString("status");
            // status值参考：https://developer.apple.com/documentation/appstorereceipts/status
            if ("0".equals(status)) {
                // status=0，成功
                JSONArray jsonArray = appleResponse.getJSONObject("receipt").getJSONArray("in_app");
                for (Object object : jsonArray) {
                    JSONObject jsonObject = (JSONObject) object;
                    String transactionId = jsonObject.getString("transaction_id");
                    String productId = jsonObject.getString("product_id");
                    String quantity = jsonObject.getString("quantity");
                    // TODO 校验productId、金额等数据，校验通过则表示支付成功，进行发放权益的逻辑
                }
            } else if ("21007".equals(status)) {
                // status=21007，支付结果来自沙箱环境，苹果在审核时，会通过沙箱环境提交请求，这里需要特殊处理一下，参考：https://www.jianshu.com/p/7e7c3a918946
            } else {
            }
        } catch (Exception e) {
            log.error("请求苹果服务器验证发生异常！", e);
        }
        return null;
    }

    /**
     * 向苹果服务器发送请求，验证App端提交的支付结果是否有效
     *
     * @param url 购买凭证验证地址
     * @param receipt
     * @return 苹果响应的请求结果
     */
    private String sendRequestToAppleServer(String url, String receipt) throws Exception {
        // 防止因HTTPS证书认证失败造成API调用失败，忽略证书信任问题
        HostnameVerifier hv = (hostname, session) -> true;
        trustAllHttpsCertificates();
        HttpsURLConnection conn = (HttpsURLConnection) new URL(url).openConnection();
        conn.setHostnameVerifier(hv);
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-type", "application/json");
        JSONObject obj = new JSONObject();
        obj.put("receipt-data", receipt);
        // 发送请求
        BufferedOutputStream buffOutStr = new BufferedOutputStream(conn.getOutputStream());
        buffOutStr.write(obj.toString().getBytes());
        buffOutStr.flush();
        buffOutStr.close();
        // 获取请求结果
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        StringBuilder sb = new StringBuilder();
        String line = null;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return sb.toString();
    }

    /**
     * 忽略证书信任问题
     * @throws Exception
     */
    private void trustAllHttpsCertificates() throws Exception {
        TrustManager[] trustAllCerts = new TrustManager[] {
                new X509TrustManager() {
                    public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                    public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                    public X509Certificate[] getAcceptedIssuers() {
                        return null;
                    }
                }
        };
        SSLContext sc = SSLContext.getInstance("SSL");
        sc.init(null, trustAllCerts, null);
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
    }
}
```

根据 `Receipt` 进行校验存在一个坑，`receipt` 解析出的交易信息存在两种格式，因此在处理交易信息时需要同时考虑这两种格式的数据，具体参考文章：[谈谈苹果应用内支付(IAP)的坑](https://www.jianshu.com/p/c3c0ed5af309)

![picture 0](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/3a5433e09b37e045958eae688dff6adea1f2ec6bb92dfd5feaec8a65a6ffb641.png)  

在对接过程中发现 `verifyReceipt` 方法已被弃用，并且根据 `Receipt` 进行验证的方式也被弃用了，如下：

![picture 1](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/dc63925b2da0e17f69301ea9a30df5fc5e699d8384b84fe68c47756e34c3d17a.png)  

按照文档中的提示，可以使用 [Validating receipts with the App Store](https://developer.apple.com/documentation/appstorereceipts/validating_receipts_with_the_app_store) 这种方式替代已被弃用的 [verifyReceipt](https://developer.apple.com/documentation/appstorereceipts/verifyreceipt)。但是根据上面的提示，**根据 `Receipts` 进行验证这种方式已经被弃用了，可以使用 [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi) 或者 [App Store Server Notifications V2](https://developer.apple.com/documentation/appstoreservernotifications/app_store_server_notifications_v2) 进行接入**，因此这里就不再验证 [Validating receipts with the App Store](https://developer.apple.com/documentation/appstorereceipts/validating_receipts_with_the_app_store) 这种接入方式了。

### 根据 `App Store Server API` 进行验证

[App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)

根据文档的指引，可以通过请求 [Get Transaction Info](https://developer.apple.com/documentation/appstoreserverapi/get_transaction_info) 接口来获取交易信息。上面说过，App端支付完成后，Apple服务器会返回支付结果给App端，返回结果除了上面的 `receipt` 外，还包含一个 `TransactionId`，这是苹果定义的交易ID，服务端拿到这个 `TransactionId` 去请求 [Get Transaction Info](https://developer.apple.com/documentation/appstoreserverapi/get_transaction_info) 接口获取具体的交易信息即可。

直接在上面 `verifyReceipt` 相关的代码基础上进行调整，但是直接请求会报 `401` 异常，如下：

![picture 2](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/a7700bcd1ddfe474b301bd4ff0ecb10ffef3aadf136cc12bb5e44a7ddc4d8a18.png)  

继续看文档，发现需要构建 `JWT` 令牌：

![picture 3](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/240213dac783fcfc49829f11a16e830ccf079e0f046260e509cd8d455581cdbd.png)  

在 [Generating JSON Web Tokens for API requests](https://developer.apple.com/documentation/appstoreserverapi/generating_json_web_tokens_for_api_requests) 这篇文档中，有完整的构建 `JWT`的指引。但文档中提到，苹果提供了官方库来简化这个操作：

![picture 4](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/342f51261add2e442f586323b02852b08fbda520211326526346acb70da0f3d2.png)  

在 [Simplifying your implementation by using the App Store Server Library](https://developer.apple.com/documentation/appstoreserverapi/simplifying_your_implementation_by_using_the_app_store_server_library) 这篇文档中提到，可以使用 [app-store-server-library](https://github.com/apple/app-store-server-library-java) 这个库来简化流程。阅读这个库的源码后发现，`App Sotre Server API` 中的接口请求在这个库中都封装好了，只需要提供必要的配置参数调用对应的方法即可。

![picture 5](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/13b2aed857b7f302973dffdbed79e8bf7c8a62d235c13ac8648aac2bb92ebdde.png)  

但这个库仅支持 `Java 11+` 项目，我们的项目是 `Java 8`，因此无法使用，引入之后打包时会出现如下报错：

![picture 6](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/a3493cb5fe0d36bc90a9036d8b336fe5e037025e9df837419781a342045d1d87.png)  

因此只能自己再造一次轮子了，直接在 `app-store-server-library` 库的代码基础上进行改造，代码如下：

```java
/**
 * 校验交易ID
 * @param transactionId
 * @throws Exception
 */
private JSONObject verifyTransactionFromAppleServer(String transactionId) throws Exception {
    String keyId = "xxxxx";
    String issuerId = "xxxxxx-ccccc-bbbb-xxx-aaaaa";
    String bundleId = "xxx";
    String signedTransactionInfo = getTransactionInfo(transactionId, generateJWT(keyId, issuerId, bundleId));
    log.info("获取到的Transaction信息: {}", signedTransactionInfo);
    JSONObject transactionInfo = verifyAndGet(signedTransactionInfo);
    log.info("解签后的信息：{}", transactionInfo);
    return transactionInfo;
}

/**
 * 从Apple服务器获取交易信息
 * @param transactionId
 * @param jwt
 * @return
 * @throws IOException
 */
public String getTransactionInfo(String transactionId, String jwt) throws IOException {
    URL url = new URL(getTransactionUrlTest + transactionId);
    HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
    connection.setRequestMethod("GET");
    connection.setRequestProperty("Authorization", "Bearer " + jwt);
    connection.setRequestProperty("Accept", "application/json");
    connection.setDoOutput(true);
    int responseCode = connection.getResponseCode();
    if (responseCode == HttpsURLConnection.HTTP_OK) { // success
        try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
            String inputLine;
            StringBuilder response = new StringBuilder();
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            JSONObject jsonObject = JSONObject.parseObject(response.toString());
            return jsonObject.getString("signedTransactionInfo");
        }
    } else {
        throw new RuntimeException("请求Apple Server获取交易信息失败！code: " + responseCode);
    }
}

/**
 * 生成JWT信息，用于请求Apple服务器
 * @param keyId
 * @param issuerId
 * @param bundleId
 * @return
 * @throws Exception
 */
public String generateJWT(String keyId, String issuerId, String bundleId) throws Exception {
    // 读取私钥文件内容，并移除干扰字符
    InputStream keyInputStream = getClass().getClassLoader().getResourceAsStream("appleRootCertificates/AuthKey_79Y987YU9N.p8");
    String encodedKey = readInputStreamToString(keyInputStream).replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replaceAll("\\s+", "");
    // 解码并生成私钥对象
    byte[] pkcs8EncodedKey = Base64.getDecoder().decode(encodedKey);
    PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(pkcs8EncodedKey);
    KeyFactory keyFactory = KeyFactory.getInstance("EC");
    PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

    // 生成 JWT Token
    Map<String, Object> claimsMap = new HashMap<>();
    claimsMap.put("bid", bundleId);
    // 使用的是io.jsonwebtoken:jjwt库生成JWT
    return Jwts.builder()
            .setAudience("appstoreconnect-v1")
            .setExpiration(DateUtils.plusMinute(5, new Date()))
            .setIssuer(issuerId)
            .setHeaderParam("kid", keyId)
            .addClaims(claimsMap)
            .signWith(SignatureAlgorithm.ES256, privateKey)
            .compact();
}

/**
 * 读取文件中的字符
 * @param inputStream
 * @return
 * @throws IOException
 */
private String readInputStreamToString(InputStream inputStream) throws IOException {
    StringBuilder content = new StringBuilder();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
        String line;
        while ((line = reader.readLine()) != null) {
            content.append(line).append(System.lineSeparator());
        }
    }
    return content.toString();
}

/**
 * 解析加签的返回结果
 * @param signedPayload
 * @return
 * @throws CertificateException
 */
public JSONObject verifyAndGet(String signedPayload) {
    // 使用的是com.auth0:java-jwt库解析数据
    DecodedJWT decodedJWT = JWT.decode(signedPayload);
    // 拿到 header 中 x5c 数组中第一个
    String header = new String(Base64.getUrlDecoder().decode(decodedJWT.getHeader()));
    String x5c = JSONObject.parseObject(header).getJSONArray("x5c").getString(0);
    // 获取公钥
    PublicKey publicKey = getPublicKeyByX5c(x5c);
    // 验证 token
    Algorithm algorithm = Algorithm.ECDSA256((ECPublicKey) publicKey, null);
    try {
        algorithm.verify(decodedJWT);
    } catch (SignatureVerificationException e) {
        throw new RuntimeException("签名验证失败！", e);
    }
    // 解析数据
    return JSONObject.parseObject(new String(Base64.getDecoder().decode(decodedJWT.getPayload())));
}


/**
 * 获取公钥
 * @param x5c
 * @return
 * @throws CertificateException
 */
private PublicKey getPublicKeyByX5c(String x5c) {
    byte[] x5c0Bytes = Base64.getDecoder().decode(x5c);
    try {
        CertificateFactory fact = CertificateFactory.getInstance("X.509");
        X509Certificate cer = (X509Certificate) fact.generateCertificate(new ByteArrayInputStream(x5c0Bytes));
        return cer.getPublicKey();
    } catch (CertificateException e) {
        throw new RuntimeException("签名验证失败！", e);
    }
}
```

需要引入下面两个依赖：

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt</artifactId>
    <version>0.9.0</version>
</dependency>
<dependency>
  <groupId>com.auth0</groupId>
  <artifactId>java-jwt</artifactId>
  <version>4.4.0</version>
</dependency>
```

生成的 `JWT`的处理，我这里使用的是 `io.jsonwebtoken:jjwt` 库，而 `app-store-server-library` 库中用的是 `com.auth0:java-jwt` 库。之所以这么处理，是因为 `com.auth0:java-jwt` 库在我项目中存在依赖冲突，会导致生成 `JWT` 时出现报错（但解析是正常，之后又有时间深入调查下，依赖冲突的问题应该可以修复）。

![picture 7](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/899b885ca3fcf9f1715264ea3d0e6bee8742bed7c6348100efc3a6ddb3f53466.png)  

### 使用 `app-store-server-library` 库

在项目中引入这个库

```xml
<dependency>
    <groupId>com.apple.itunes.storekit</groupId>
    <artifactId>app-store-server-library</artifactId>
    <version>3.1.0</version>
</dependency>
```

这个库的 `README.md` 中已经提供了示例，我们在它提供的示例代码上进行调整即可，下面是获取交易请求相关的代码：

```java
import com.apple.itunes.storekit.client.APIException;
import com.apple.itunes.storekit.client.AppStoreServerAPIClient;
import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.model.SendTestNotificationResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class APIExample {
    public static void main(String[] args) throws Exception {
        String issuerId = "99b16628-15e4-4668-972b-eeff55eeff55";
        String keyId = "ABCDEFGHIJ";
        String bundleId = "com.example";
        Path filePath = Path.of("/path/to/key/SubscriptionKey_ABCDEFGHIJ.p8");
        String encodedKey = Files.readString(filePath);
        Environment environment = Environment.SANDBOX;

        AppStoreServerAPIClient client =
                new AppStoreServerAPIClient(encodedKey, keyId, issuerId, bundleId, environment);

        try {
            SendTestNotificationResponse response = client.getTransactionInfo("xxx");
            System.out.println(response);
        } catch (APIException | IOException e) {
            e.printStackTrace();
        }
    }
}
```

其中我们要提供几个参数：`issuerId`、`keyId`、`SubscriptionKey_ABCDEFGHIJ.p8` 私钥证书文件、`bundleId`

![picture 8](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/c85ed3de4fc8a8350248e805cc03c8763270467669d3df697b0e57cd6f32e9a6.png)  

`bundleId` 是 `iOS` 应用的唯一标识符，可以在下面拿到

![picture 9](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/397bca4a5977b459f9d57df4e6d6ec7a0b160e3d124343394617ecc7be252c76.png)  

剩下3个参数需要配置 `App Store Connect API` 密钥，如下：

![picture 10](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/e84c3c968d30e482ef4dc8c6625c17534db803460d60bbae1a345dc0fc4447b7.png)  

请求 `Apple Server` 拿到的交易信息还需要进行解签，解签方法如下：

```java
import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.model.ResponseBodyV2DecodedPayload;
import com.apple.itunes.storekit.verification.SignedDataVerifier;
import com.apple.itunes.storekit.verification.VerificationException;

import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Set;

public class ExampleVerification {
    public static void main(String[] args) {
        String bundleId = "com.example";
        Environment environment = Environment.SANDBOX;
        Set<InputStream> rootCAs = Set.of(
                new FileInputStream("/path/to/rootCA1"),
                new FileInputStream("/path/to/rootCA2")
        );
        Long appAppleId = null; // appAppleId must be provided for the Production environment

        SignedDataVerifier signedPayloadVerifier = new SignedDataVerifier(rootCAs, bundleId, appAppleId, environment, true);
        
        String notificationPayload = "ey...";

        try {
            ResponseBodyV2DecodedPayload payload = signedPayloadVerifier.verifyAndDecodeNotification(notificationPayload);
            System.out.println(payload);
        } catch (VerificationException e) {
            e.printStackTrace();
        }
    }
}
```

这个方法要求我们提供 `Apple Root Certificates` 和 `Apple ID`，`Apple ID` 在下面拿到：

![picture 11](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/26dff49a2bf9ac4f9246e38b6d959577aef91c016f9fad271095ca6fee79ea73.png)  

`Apple Root Certificates`直接去 [Apple PKI](https://www.apple.com/certificateauthority/) 下载即可

![picture 12](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/f3030cf9aa958385f6740b81b897a48cebb8432076f2c92987cc3f1ef65d547c.png)  

![picture 13](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/dac87838bb9bd56eca89bb108a7f23d76f98513b72844470f262d740097bef8f.png)  

下面放上完整的代码：**根据 `App` 端提供的 `TransactionId`，请求 `Apple Server` 获取对应的交易信息，并进行解签**

```java
public class Main {
    public static void main(String[] args) throws Exception {
        Main main = new Main();
        main.getTransactionThrowApple("2000000690856066");
    }

    private void getTransactionThrowApple(String transactionId) throws IOException, APIException, VerificationException {
        String keyId = "xxx";
        String issuerId = "aaaa-01b6-480c-ccccc-dddddd";
        String bundleId = "xxxxxxx";
        Long appleId = 1562213344L;

        Path filePath = Path.of("E://AuthKey_xxx.p8");
        String encodedKey = Files.readString(filePath);
        Environment environment = Environment.SANDBOX;
        Set<InputStream> rootCAs =  Set.of(
                new FileInputStream("E://AppleComputerRootCertificate.cer"),
                new FileInputStream("E://AppleIncRootCertificate.cer"),
                new FileInputStream("E://AppleRootCA-G2.cer"),
                new FileInputStream("E://AppleRootCA-G3.cer")
        );

        //创建appleStoreServer对象
        AppStoreServerAPIClient client = new AppStoreServerAPIClient(encodedKey,keyId,issuerId,bundleId,environment);
        //根据传输的订单号获取订单信息
        TransactionInfoResponse sendResponse = client.getTransactionInfo(transactionId);
        Long appAppleId = null ;
        Boolean onlineChecks = false ;
        SignedDataVerifier signedDataVerifier = new SignedDataVerifier(rootCAs,bundleId,appAppleId,environment, onlineChecks);
        String signedPayLoad = sendResponse.getSignedTransactionInfo();
        //对订单信息进行解析得到订单信息
        JWSTransactionDecodedPayload payload = signedDataVerifier.verifyAndDecodeTransaction(signedPayLoad);
        //进行订单信息处理
    }
}
```

### 苹果服务器的异步回调

[App Store Server Notifications V2](https://developer.apple.com/documentation/appstoreservernotifications/app_store_server_notifications_v2)

苹果的异步回调无法携带 [用户自定义的订单ID]，不太理解苹果这么设计异步回调的意义，支付宝和微信的异步回调都可以携带这些信息。如果回调信息中携带了这个值，那么 `App` 支付成功后就无需再请求服务端了，`App` 支付成功后还必须去请求服务端将 [苹果交易ID] 和 [自定义订单] 绑定，既然已经有了异步通知，那这一步操作总觉得有些多余。（*之后可以调查一下苹果这么设计的原因*）

下面看一下如何在服务端实现接收 `Apple Server` 的异步回调，首先需要配置服务器通知地址，配置方式见：[Enter server URLs for App Store Server Notifications](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/enter-server-urls-for-app-store-server-notifications)

![picture 14](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/5cb74f4040a2a4ec5a84750fcdfc2fb96f8dc10612e79e5461eef4381eb7d7fb.png)  

然后就是服务端代码，参考文档：[使用Java接入苹果内购流程（附主要代码）](https://blog.csdn.net/qq_37896194/article/details/137933425)

```java
/**
 * 苹果支付-服务器异步通知
 * https://developer.apple.com/documentation/appstoreservernotifications
 */
@PostMapping("/returnPayAsynchronousFromApplePay")
public boolean returnPayAsynchronousFromApplePay(@RequestBody Map<String, String> postData) {
    logger.info("收到来自苹果支付的回调请求: {}", postData);
    String signedPayload = postData.get("signedPayload");
    if (StringUtils.isBlank(signedPayload)) {
        logger.error("非法请求！");
        return false;
    }
    dealAsyncResultFromApplePay(signedPayload);
    return true;
}

/**
 * 处理来自苹果支付回调的异步请求
 * @param signedPayload 加签的返回信息
 */
public void dealAsyncResultFromApplePay(String signedPayload) {
    JSONObject payload = verifyAndGet(signedPayload);
    logger.info("解签后的 [signedPayload] 数据：{}", payload);
    JSONObject data = payload.getJSONObject("data");
    String signedTransactionInfo = data.get("signedTransactionInfo").toString();
    JSONObject transactionInfo = verifyAndGet(signedTransactionInfo);
    logger.info("解签后的 [signedTransactionInfo] 数据：{}", transactionInfo);
    String transactionId = transactionInfo.get("transactionId").toString();
    String originalTransactionId = transactionInfo.get("originalTransactionId").toString();
    String productId = transactionInfo.get("productId").toString();

    String environment = data.get("environment").toString();
    String notificationType = payload.get("notificationType").toString();
    if ("ONE_TIME_CHARGE".equals(notificationType)) {
        // 只需要处理 [一次性消费] 类型
        // payReturnService.updateForSpecificLogic(transactionId, null);
    } else {
        logger.warn("notificationType: [{}]，不做处理...", notificationType);
    }
}

/**
 * 解析加签的返回结果
 * @param signedPayload
 * @return
 * @throws CertificateException
 */
public JSONObject verifyAndGet(String signedPayload) {
    DecodedJWT decodedJWT = JWT.decode(signedPayload);
    // 拿到 header 中 x5c 数组中第一个
    String header = new String(Base64.getUrlDecoder().decode(decodedJWT.getHeader()));
    String x5c = JSONObject.parseObject(header).getJSONArray("x5c").getString(0);
    // 获取公钥
    PublicKey publicKey = getPublicKeyByX5c(x5c);
    // 验证 token
    Algorithm algorithm = Algorithm.ECDSA256((ECPublicKey) publicKey, null);
    try {
        algorithm.verify(decodedJWT);
    } catch (SignatureVerificationException e) {
        throw new RuntimeException("签名验证失败！", e);
    }
    // 解析数据
    return JSONObject.parseObject(new String(Base64.getDecoder().decode(decodedJWT.getPayload())));
}


/**
 * 获取公钥
 * @param x5c
 * @return
 * @throws CertificateException
 */
private PublicKey getPublicKeyByX5c(String x5c) {
    byte[] x5c0Bytes = Base64.getDecoder().decode(x5c);
    try {
        CertificateFactory fact = CertificateFactory.getInstance("X.509");
        X509Certificate cer = (X509Certificate) fact.generateCertificate(new ByteArrayInputStream(x5c0Bytes));
        return cer.getPublicKey();
    } catch (CertificateException e) {
        throw new RuntimeException("签名验证失败！", e);
    }
}
```

### 异常情况的处理

如果支付完成后 `App` 请求服务端失败，导致 [苹果交易ID] 和 [自定义订单] 没有绑定，那么后续的权益发放将不会进行，也就是虽然用户支付成功了，但是并没有收到对应的权益。需要对这种异常请开干进行补偿处理，建议阅读：[苹果支付有哪些坑，为什么苹果支付比支付宝和微信容易丢单？](https://www.cnblogs.com/ricklz/p/17993800)

![picture 15](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/2e5edde04eb465c100a226b59d20095ccafe4d280a42961fba7371d282b5d7c4.png)  

除此之外，服务端在进行支付校验时，还需要完善校验逻辑，`productID`、`BundleID`、支付金额 这些信息都要校验，并且要保证 `TransactionId` 不会被重复绑定。

相关文章：[iOS 内购处理方案与流程的探究](https://juejin.cn/post/7118770506702012453)

### Apple StoreKit 2

上面提到，支付宝和微信支付的支付回调中携带了自定义的订单ID，而苹果支付回调没有携带，因此需要App主动请求服务器完成 [苹果支付ID] 和 [自定义订单ID] 的绑定。在阅读文档时，发现Apple是支持传递这个 [自定义订单ID] 的，见 [appAccountToken](https://developer.apple.com/documentation/appstoreserverapi/appaccounttoken)。这个特性是Apple StoreKit 2 新引入的，只要App开发时接入了这个，那么在发起支付时就可以传递这个值。

![picture 16](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/e504462d25ad2fc7f920606892d0579bb35f4ff46ab5634c8ab0793e17c29a57.png)  

看到文档中提到，SotreKit 2最低支持版本是IOS15，产生了一个疑问：如果用户的系统低于IOS15，Storekit2可能就无法用了？调查之后发现确实是这样，那么App端接入了StoreKit 2，还需要保留StoreKit1，也就是说App端需要使用两套代码：**用户系统是IOS15以下，使用StoreKit1的代码；用户系统是IOS15以上，使用StoreKit2的代码。**

具体接入处理参考：[StoreKit2 实际接入时候的踩坑与解决实录](https://juejin.cn/post/7122458652945956878)

### 处理苹果内购退款

之前对接的支付宝和微信支付，退款操作都是需要通过服务器中转才能发起的。但是苹果比较特殊，商家不能发起退款，退款只能由用户发起，并且这个操作不会经过商家服务器，用户的退款申请会直接发起到苹果，苹果客服审核通过，会直接打款给用户，具体见这篇文档：[Handling refund notifications](https://developer.apple.com/documentation/storekit/in-app_purchase/original_api_for_in-app_purchase/handling_refund_notifications)。文档中提到，用户可以通过下面几种方式发起退款：

![picture 17](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/82d001a9974b45c93109876c529a119fad5db1e21891e8b0deff67ae962b68fd.png)  

> 上面提到的第2种退款方式，操作步骤参考文档：[针对从 Apple 购买的 App 或内容请求退款](https://support.apple.com/zh-cn/118223)

用户可以不经过商家直接向苹果发起退款，如果退款成功，那商家就等于是被薅羊毛了。因此商家有必要对用户发起的退款订单做出响应，苹果官方提供的方法是，监听苹果回调的退款通知，然后执行相应的逻辑：

![picture 18](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/ef10e2ee4ed8ecacb068269426a447ba4000b3627c340227b8bf5bda9be6c8e7.png)  

上面讲的是 **在用户退款成功后，苹果服务器会给商户服务器发送一个回调请求**。在 [Send Consumption Information](https://developer.apple.com/documentation/appstoreserverapi/send_consumption_information) 这篇文档中了解到，**用户发起退款时，苹果服务器也会给商户服务器发送一个回调请求**。商户服务器收到这个请求后，可以在12小时内给苹果服务器反馈一些协助退款的信息，这个信息苹果只做参考用。个人认为这个反馈操作可有可无，但商户服务器可以通过这个回调请求来获取有哪些用户发起了退款请求。

目前考虑苹果内购退款的整体逻辑按下面的步骤处理：

1. 用户向苹果发起退款。
2. 苹果收到退款请求，给服务器发送通知，服务器在日志中记录发起退款的用户的信息。
3. 苹果同意退款，用户成功收到苹果的打款。服务器收到苹果回调的通知，对用户进行退款成功后权益收回的操作。

对于退款期限，苹果并没有明确的说明，网上找到的说法是90天可以申请退款。苹果的这种退款机制，很容易出现用户恶意退款薅羊毛的情况(*搜索关键词：苹果 退款 羊毛*)。这种情况在我们的App中也可以找到对应的案例：用户购买了云豆，然后用云豆购买了礼物送给其他人，云豆余额变为0之后，该用户向苹果申请退款并成功收到了退款。这种情况考虑按如下逻辑处理：仍然按正常逻辑对该用户的云豆余额进行扣除，但这会导致用户的云豆余额变为负数。如果之后开放了VIP服务，用户在VIP到期后向苹果申请退款并且成功，这种情况也需要考虑。

参考文档：[对接苹果支付退款退单接口](https://blog.csdn.net/zxc_user/article/details/134561731)

### 转账红包功能接入IAP

在 [App 审核指南 - Apple](https://developer.apple.com/cn/app-store/review/guidelines/) 文档中，其中 **[3.2.1-应做事项]** 中提到如下内容：

![picture 19](https://cdn.jsdelivr.net/gh/JokerByrant/Images@main/blog/3522582a6dc64cc130b287f6ef977144d8684313b30443833a92903b8cbf57f5.png)  

而我们 `App` 中的红包功能，似乎满足上面说的两种情况，因此应该无需接入 `IAP`。

### IAP功能测试

参考文档：[IAP支付测试](https://www.jane-dev.com/technology/IAP/)

### 参考文章

[苹果应用内购买(IAP)，服务器端开发处理流程](https://www.jianshu.com/p/7e7c3a918946)

[苹果应用内购买(IAP)—从入门到放弃](https://sq.sf.163.com/blog/article/195248945842995200)

[iOS应用内购买In-App-Purchase流程及前后端交互流程](https://www.jianshu.com/p/25933fcc400e)

[Java接入苹果支付](https://www.zanglikun.com/7408.html)

[In-App Purchase 服务端接入实用技术](https://1pxup.ook.fun/post/2022-12/in-apps-purchase-server.html)

[Validating receipts with the App Store deprecated - stackoverflow](https://stackoverflow.com/questions/76438494/validating-receipts-with-the-app-store-deprecated)

[When will the verifyReceipt api be deprecated?](https://developer.apple.com/forums/thread/731550)

[想抄作业了，有没有 Apple 内购的后端设计方案](https://www.v2ex.com/t/937771)

[Apple Storekit2 服务器API升级 (Apple开源内购库) (已上线)](https://juejin.cn/post/7373944051294666778)

[使用Java接入苹果内购流程（附主要代码）](https://blog.csdn.net/qq_37896194/article/details/137933425)

[app-store订阅消息开发\内购票据验证](https://blog.csdn.net/qq_41871864/article/details/138130003)

[iOS 内购处理方案与流程的探究](https://juejin.cn/post/7118770506702012453)

[ApplePay 服务端单据验证](https://www.linhuiy.com/posts/2385.html)
