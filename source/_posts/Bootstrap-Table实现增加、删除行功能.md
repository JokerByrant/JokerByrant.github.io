---
title: Bootstrap-Table实现增加、删除行功能
tags:
  - Bootstrap-Table
  - Html
categories: 前端技术
abbrlink: 16098
date: 2022-06-01 11:28:44
---

先看效果图：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/16642421509398b531ab5c17d46424074d5ebf1bd9206.png)

<!-- more -->

上代码：

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.w3.org/1999/xhtml">

<head>
    <meta charset="UTF-8"/>
    <title>云鱼管理后台</title>
</head>
<body th:fragment="chargeSetting">
    <form class="form-horizontal m-t" id="settingForm">
        <input id="settingUid" name="settingUid" class="form-control" type="hidden" />
        <input id="version" name="version" class="form-control" type="hidden" />

        <!-- 云鱼合伙人等级收益配置 -->
        <div class="form-group">
            <label class="label-xs control-label">合伙人等级收益配置</label>
            <div class="col-sm-8 list-table">
                <button type="button" id="addCharge" class="btn btn-xs btn-info"><i class="fa fa-plus"></i> 新增</button>
                <button type="button" class="btn btn-xs btn-info" onclick="reOrder('charge', 0)" style="padding: 1px 5px"><i class="fa fa-arrow-up"></i></button>
                <button type="button" class="btn btn-xs btn-info" onclick="reOrder('charge', 1)" style="padding: 1px 5px"><i class="fa fa-arrow-down"></i></button>
                <table id="table-charge"></table>
            </div>
        </div>

        <div class="hr-line-dashed" style="clear: both"></div>

        <div class="hr-line-dashed" style="clear: both"></div>
        <div class="form-button form-group" sec:authorize="hasAnyAuthority('setting:update')">
            <div class="col-sm-8 col-sm-offset-2" style="margin-top: 20px">
                <button type="submit" class="btn btn-primary">保存提交</button>
            </div>
        </div>
    </form>
    <script th:inline="javascript">
        initSubmitForm();
        initPartnerTable(12);

        $().ready(function() {
            let model = [[${model}]];
            $("#version").val(model.version);
            $("#settingUid").val(model.settingUid);
        });

        // 组装提交到后台的表单数据
        function getSubmitParam() {
            let param = {};
            param.version = $("#version").val();
            param.settingUid = $("#settingUid").val();
            param.moduleName = "partnerSetting";
            // 云豆收费数据
            param.chargeSettings = getChargeSubmitParam();
            return param;
        }

        //============================= 云豆收费表格相关 ================================
        // 初始化收费规则表格
        function initPartnerTable(chargeType) {
            $("#table-charge").bootstrapTable("destroy").bootstrapTable({
                url: "/chargeSetting/selectByChargeType?chargeType="+chargeType,	//请求后台的URL（*）
                method: 'GET',                      //请求方式（*）
                toolbar: '.searchArea',
                clickEdit: true,
                striped: true,                      //是否显示行间隔色
                sortOrder: "asc",                   //排序方式
                queryParamsType:"limit",
                contentType:"application/x-www-form-urlencoded; charset=UTF-8",
                minimumCountColumns: 2,             //最少允许的列数
                clickToSelect: false,                //是否启用点击选中行
                singleSelect: true,
                uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
                columns: [{
                    checkbox: true,
                    width:50
                }, {
                    field: 'chargeName',
                    title: '等级名称',
                    halign: 'center',
                    align: 'center',
                    width: '130px',
                    formatter: function (value, row, index) {
                        return '<input maxlength="8" style="width: 80%" type="text" required="true" name="chargeName'+index+'" id="chargeName'+index+'" value="'+value+'" />';
                    }
                }, {
                    field: 'chargeNum',
                    title: '推广码使用达标人数',
                    halign: 'center',
                    align: 'center',
                    width: '130px',
                    formatter: function (value, row, index) {
                        return '<input maxlength="8" style="width: 80%" type="text" required="true" isZzs="true" name="chargeNum'+index+'" id="chargeNum'+index+'" value="'+value+'" />';
                    }
                }, {
                    field: 'chargeMoney',
                    title: '收益百分比',
                    halign: 'center',//表头居中
                    align: 'center',
                    width: '130px',
                    formatter: function (value, row, index) {
                        return '<input maxlength="8" style="width: 80%" type="text" required="true" checkNumFormat="true" name="chargeMoney'+index+'" id="chargeMoney'+index+'" value="'+value+'" />';
                    }
                }, {
                    field: 'useStatus',
                    title: '开启状态',
                    halign: 'center',
                    formatter: function (value, row, index) {
                        let isChecked = value==1?"checked":"unchecked";
                        return '<div class="switch">' +
                            '<div class="onoffswitch">' +
                            '<input type="checkbox" '+isChecked+' class="onoffswitch-checkbox" id="useStatus'+index+'">' +
                            '<label id="useStatusCheckbox'+index+'" class="onoffswitch-label" for="useStatus'+index+'">' +
                            '<span class="onoffswitch-inner"></span>' +
                            '<span class="onoffswitch-switch"></span>' +
                            '</label>' +
                            '</div>' +
                            '</div>';
                    }
                }, {
                    field: 'chargeUid',
                    title: '操作',
                    halign: 'center',
                    align: 'center',
                    width: '50px',
                    formatter: function (value, row, index) {
                        return '<input id="chargeUid'+index+'" value="'+value+'" type="hidden">' +
                            '<button title="删除" class="btn btn-warning btn-circle" type="button" onclick="deleteRow(\'charge\','+index+')" ><i class="fa fa-times"></i></button>';
                    }
                }],
                onLoadSuccess: function (data) {
                    initAddChargeEvent();
                },
                formatLoadingMessage: function(){
                    return "请稍等，正在加载中。。。";
                }
            });
        }
        // 初始化新增收费规则事件
        function initAddChargeEvent() {
            $("#addCharge").off("click").on("click", function() {
                let trLength = $('#table-charge>tbody').children("tr").length;
                let uid = SystemNameSpace.common.uuid();
                if(trLength == 1){
                    if ($('#table-charge>tbody>tr')[0].className == 'no-records-found') {
                        $('#table-charge>tbody>tr').remove();
                        trLength = 0;
                    }
                }
                let appendHtml = '<tr data-index="'+trLength+'">' +
                    '<td class="bs-checkbox ">' +
                    '<input data-index="0" name="btSelectItem" type="checkbox">' +
                    '</td>' +
                    '<td style="text-align: center; width: 130px">' +
                    '<input maxlength="8" style="width: 80%" type="text" required="true" name="chargeName'+trLength+'" id="chargeName'+trLength+'" value="" />' +
                    '</td>' +
                    '<td style="text-align: center; width: 130px">' +
                    '<input maxlength="8" style="width: 80%" type="text" isZzs="true" required="true" name="chargeNum'+trLength+'" id="chargeNum'+trLength+'" value="" />' +
                    '</td>' +
                    '<td style="text-align: center; width: 130px">' +
                    '<input maxlength="8" style="width: 80%" type="text" checkNumFormat="true" required="true" name="chargeMoney'+trLength+'" id="chargeMoney'+trLength+'" value="" />' +
                    '</td>' +
                    '<td>' +
                    '<div class="switch">' +
                    '<div class="onoffswitch">' +
                    '<input type="checkbox" class="onoffswitch-checkbox" id="useStatus'+trLength+'" name="useStatus'+trLength+'">' +
                    '<label id="useStatusCheckbox'+trLength+'" class="onoffswitch-label" for="useStatus'+trLength+'">' +
                    '<span class="onoffswitch-inner"></span>' +
                    '<span class="onoffswitch-switch"></span>' +
                    '</label>' +
                    '</div>' +
                    '</div>' +
                    '</td>'+
                    '<td style="text-align: center; width: 50px ">' +
                    '<input id="chargeUid'+trLength+'" value="'+uid+'" type="hidden">' +
                    '<button title="删除" class="btn btn-warning btn-circle" type="button" onclick="deleteRow(\'charge\','+trLength+')" ><i class="fa fa-times"></i></button>' +
                    '</td>';
                $('#table-charge>tbody').append(appendHtml);
                setCheckBoxSingleCheck('charge');
            });
        }
        // 获取收费规则表格参数
        function getChargeSubmitParam() {
            let list = [];
            let o = {};

            // 云鱼合伙人等级收益配置表格
            let arr = $('#table-charge').children("tbody").children("tr");
            for (let index = 0; index < arr.length; index++) {
                if (arr[index].innerHTML && !arr[index].classList.contains('no-records-found')) {
                    let i = arr[index].dataset.index; // i->数据索引，index->对应的那一行html element
                    o = {};
                    o.chargeUid = $("#chargeUid"+i).val();
                    o.chargeType = 12;
                    o.chargeName = $("#chargeName"+i).val();
                    o.chargeMoney = $("#chargeMoney"+i).val();
                    o.chargeNum = $("#chargeNum"+i).val();
                    o.useStatus = $("#useStatus"+i)[0].checked ? 1 : 0;
                    o.chargeSort = index;
                    list.push(o);
                }
            }

            return list;
        }
        //--------------------------------------------------------------------------

        //============================= 表格相关 ==================================
        // 删除一行数据, id->表格id，index->数据索引
        function deleteRow(id, index) {
            let arr = $('#table-'+id).children("tbody").children("tr");
            for(let x = 0; x < arr.length; x++) {
                // 根据数据索引找到指定的那一行row
                if (arr[x].dataset.index == index) {
                    arr[x].innerText = "";
                }
            }
        }
        // 表格排序 direction 0->up 1->down
        function reOrder(tableId, direction) {
            let selectedData = null;
            let index;
            let allData = $('#table-'+tableId+' .bs-checkbox input');
            for(let x = 0; x < allData.length; x++) {
                if (allData[x].checked) {
                    selectedData = $(allData[x]).parents("tr")[0];
                    index = x;
                    break;
                }
            }

            if (selectedData == null) {
                layer.msg("请选择需要移动的数据！")
            } else {
                let tmp = selectedData;
                if (direction == 0) {
                    if (index == 0) {
                        // layer.msg("首行数据不能上移！")
                    } else {
                        let targetData = $(allData[index - 1]).parents("tr")[0];
                        $(selectedData).insertBefore(targetData);
                        $(targetData).insertAfter(tmp);
                    }
                } else {
                    if (index == allData.length-1) {
                        // layer.msg("尾行数据不能下移！")
                    } else {
                        let targetData = $(allData[index + 1]).parents("tr")[0];
                        $(selectedData).insertAfter(targetData);
                        $(targetData).insertBefore(tmp);
                    }
                }
            }
        }
        // 设置checkBox只能单选
        function setCheckBoxSingleCheck(tableId) {
            let allCheckBox = $('#table-'+tableId+' .bs-checkbox input');
            allCheckBox.on('change', function () {
                if (this.checked == true) {
                    for(let x in allCheckBox) {
                        if (allCheckBox[x] != this && allCheckBox[x].checked) {
                            allCheckBox[x].click();
                        }
                    }
                }
            })
        }
        //--------------------------------------------------------------------------
    </script>
</body>
</html>

```
