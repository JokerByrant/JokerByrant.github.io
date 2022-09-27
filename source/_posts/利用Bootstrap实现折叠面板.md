---
title: 利用Bootstrap实现折叠面板
tags:
  - Bootstrap
  - Html
categories: 前端技术
abbrlink: 46421
date: 2022-06-01 09:26:32
---

先来看下最终的效果图：

![](https://fastly.jsdelivr.net/gh/JokerByrant/Images@main/blog/1664242094943124099e1e278f8dfd785ea1dbaf4b07a.png)

<!-- more -->

上代码：

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.thymeleaf.org/thymeleaf-extras-springsecurity5" >

<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="renderer" content="webkit">
<meta http-equiv="Cache-Control" content="no-siteapp" />

<title>云鱼管理后台</title>

<!--[if lt IE 9]>
<meta http-equiv="refresh" content="0;ie.html" />
<![endif]-->

<div th:replace="common/layout :: headerCss"></div>
	<style>
		/*表格排序按钮样式*/
		.fixed-table-container thead th .sortable::after, .fixed-table-container thead th .desc::after, .fixed-table-container thead th .asc::after {
			font-family: FontAwesome;
			position: relative;
			left: 10px;
			color: #cccccc;
		}
		.fixed-table-container thead th .sortable::after {
			content: '\f0dc';
		}
		.fixed-table-container thead th .desc::after {
			content:"\f0dd";
		}
		.fixed-table-container thead th .asc::after {
			content: '\f0de';
		}

		/*折叠面板样式*/
		.collapse-icon{
			float: right;
			cursor: pointer;
		}
		.panel-title span{
			font-weight: bolder;
			font-size: 14px;
		}
		.panel-title .span-tips {
			float: right;
			color: #999999;
		}
		.panel-title form {
			float: left;
		}

		/*城市选择*/
		.panel-cities {
			margin-bottom: 15px;
		}
		.panel-cities span {
			margin: 0 5px;
			padding: 5px 15px;
			border: 2px solid #d9d9d9;
			border-radius: 10px;
			color: #c2c2c2;
			cursor: pointer;
			white-space: nowrap;
			line-height: 40px;
		}
		.panel-cities span:hover{
			background-color: #2a82e4;
			border-color: #2a82e4;
			color: #FFFFFF;
		}
		.panel-cities .active {
			background-color: #2a82e4 !important;
			border-color: #2a82e4 !important;
			color: #FFFFFF !important;
		}
		.panel-cities .cities-more{
			background-color: #c3c3c3;
			border-color: #c3c3c3;
			color: #FFFFFF;
		}
		.panel-cities .cities-expand {
			display: none;
		}
	</style>

</head>

<body class="gray-bg">
        	<div class="wrapper wrapper-content animated fadeInRight">
            	<div class="row">
                	<div class="col-lg-12 list-table">
	                    <div class="ibox float-e-margins">
	                        <div class="ibox-title">
								<form role="form" class="form-inline" id="searchForm" >
									<div class="from-button">
										<button sec:authorize="hasAnyAuthority('activity:save')" class="btn btn-info" id="saveButton" type="button" onclick="createActivity()"><i class="fa fa-plus"></i> 创建比赛</button>
									</div>
								</form>
	                        </div>
	                        <div class="ibox-content"></div>
	           			</div>
                	</div>
            	</div>
        	</div>

	<div th:replace="common/layout :: footerJs"></div>

    <script th:inline="javascript">
		$("#cityName").select2({
			multiple:false,
			width :"100%",
			allowClear:true
		});
		reloadTable();
		// 创建比赛
		function createActivity() {
			SystemNameSpace.common.layerOpenCustome("创建比赛", "/activity/addPage/","20%","34%");
		}
		//======================================================== Tab/表格页相关 ==========================================
		// 重新加载表格
		function reloadTable() {
			// 获取所有的活动
			let activities = getAllActivities();
			// 加载标签tab页和表格
			initFolderPanel(activities);
			// 加载表格
			activities.forEach(function (item, index) {
				initTable(index);
				if (item.cities) {
					renderCitiesPanel(index, '苏州市,上海市,呼和浩特市,南京市,北京市,镇江市,杭州市,广州市,武汉市,成都市,银川市,天津市,无锡市,大连市,长沙市,衢州市,舟山市,丽江市,哈尔滨市,乌鲁木齐市'.split(','));
				}
			});
			registerCollapseEvent();
			registerCityChooseEvent();
			registerCityExpandEvent();
		}

		// 获取所有的比赛
		function getAllActivities() {
			let list = [];
			$.ajax({
				url: '/activity/getAllActivities',
				method: 'get',
				contentType: "application/json",
				async: false,
				success: function (data) {
					list = data.data;
				}
			})
			return list;
		}

		// 初始化折叠面板
		function initFolderPanel(activities) {
			let htmlContent = "";
			activities.forEach(function (item,index) {
				let start = new Date(item.activityStart);
				let end = new Date(item.activityEnd);
				let year = start.Format("yyyy");
				let monthRange = start.Format("MM.dd hh:mm") + " ~ " + end.Format("MM.dd hh:mm");
				let title = year + "年度合伙人比赛(" + monthRange + ")";
				if (start <= new Date()) {
					if (end >= new Date()) {
						htmlContent += '<div class="panel panel-primary" style="width: 1000px">\n' +
								'        <div class="panel-heading">\n' +
								'            <div class="panel-title" style="position: relative">\n' +
								'                 <span>'+ title + '</span>' +
								'				  <form id="submitForm'+ index +'">' +
								'				  	<input type="text" id="cityName'+ index +'" name="cityName" hidden/>' +
								'				  	<input type="text" id="activityUid'+ index +'" name="activityUid" value="'+ item.activityUid +'" hidden>' +
								'				  </form>' +
								'			 	  <a class="collapse-icon fa fa-chevron-up" id="'+ index +'" data-toggle="collapse" href="#collapse'+ index +'"></a>' +
								'            </div>\n' +
								'        </div>\n' +
								'		 <div id="collapse'+ index +'" class="panel-collapse collapse in" aria-expanded="true">\n' +
								'            <div class="panel-body" data-index="'+ index +'">\n' +
								'				<div class="panel-cities" id="cities'+ index +'"></div>' +
								'				<table class="table" id="table'+ index +'"></table>' +
								'            </div>\n' +
								'		  </div>' +
								'    	</div>';
					} else {
						htmlContent += '<div class="panel panel-default" style="width: 1000px">\n' +
								'        <div class="panel-heading">\n' +
								'            <div class="panel-title" style="position: relative">\n' +
								'                 <span>'+ title + '</span>' +
								'				  <form id="submitForm'+ index +'">' +
								'				  	<input type="text" id="cityName'+ index +'" name="cityName" hidden/>' +
								'				  	<input type="text" id="activityUid'+ index +'" name="activityUid" value="'+ item.activityUid +'" hidden>' +
								'				  </form>' +
								'			 	  <a class="collapse-icon fa fa-chevron-down" id="'+ index +'" data-toggle="collapse" href="#collapse'+ index +'"></a>' +
								'            </div>\n' +
								'        </div>\n' +
								'		 <div id="collapse'+ index +'" class="panel-collapse collapse" aria-expanded="false">\n' +
								'            <div class="panel-body" data-index="'+ index +'">\n' +
								'				<div class="panel-cities" id="cities'+ index +'"></div>' +
								'				<table class="table" id="table'+ index +'"></table>' +
								'            </div>\n' +
								'		  </div>' +
								'    	</div>';
					}
				} else {
					htmlContent += '<div class="panel panel-default" style="width: 1000px">\n' +
							'        <div class="panel-heading">\n' +
							'            <div class="panel-title" style="position: relative">\n' +
							'                 <span>'+ title + '</span>' +
							'				  <span class="span-tips">暂未开始</span>' +
							'            </div>\n' +
							'        </div>\n' +
							'    	</div>';
				}
			});
			$('.ibox-content')[0].innerHTML = htmlContent;
		}

		// 渲染城市选择面板
		function renderCitiesPanel(index, cities) {
			let $cities = $('#cities' + index);
			let html = '<span class="active">全部</span>';
			cities.forEach(function (item, i) {
				if (i < 7) {
					html += '<span data-value="'+ item +'">'+ item +'</span>';
				} else {
					html += '<span class="cities-expand cities-expand'+ index +'" data-value="'+ item +'">'+ item +'</span>';
				}
			});
			if (cities.length > 7) {
				html += '<span class="cities-more cities-more'+ index +'" data-index="'+ index +'">显示全部</span>'
			}
			$cities[0].innerHTML = html;
		}

		// 初始化表格
		function initTable(index) {
			$('#table' + index).bootstrapTable({
				url: "/activity/searchByCriteria",	//请求后台的URL（*）
				method: 'GET',                      //请求方式（*）
				toolbar: '.searchArea',              //工具按钮用哪个容器
				striped: true,                      //是否显示行间隔色
				cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
				pagination: true,                   //是否显示分页（*）
				sortable: true,                     //是否启用排序
				sortOrder: "asc",                   //排序方式
				sidePagination: "server",           //分页方式：client客户端分页，server服务端分页（*）
				queryParamsType:"limit",
				contentType:"application/x-www-form-urlencoded; charset=UTF-8",
				pageList: [10, 25, 50, 100],        //可供选择的每页的行数（*）
				queryParams: function (params) {
					console.log(params, 'params')
					return {
						pageSize: params.limit,
						page: params.offset/params.limit+1,
						sort: params.order,
						sortField: params.sort,
						condition: $('#submitForm' + index).serializeObject()
					};
				},
				search: false,                      //是否显示表格搜索
				strictSearch: true,
				showColumns: false,                  //是否显示所有的列（选择显示的列）
				showRefresh: false,                  //是否显示刷新按钮
				minimumCountColumns: 2,             //最少允许的列数
				clickToSelect: true,                //是否启用点击选中行
				//height: 500,                      //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
				uniqueId: "ID",                     //每一行的唯一标识，一般为主键列
				showToggle: false,                   //是否显示详细视图和列表视图的切换按钮
				cardView: false,                    //是否显示详细视图
				detailView: false,                  //是否显示父子表
				singleSelect: true, //禁止选
				columns: [{
					title: '序号',
					halign: 'center',//表头居中
					align: 'center',//内容居中
					formatter:function (value, row, index) {
						return index+1;
					}
				}, {
					field: 'cloudFishCode',
					halign: 'center',//表头居中
					align: 'center',//内容居中
					width: '120px',
					title: '云鱼号'
				}, {
					field: 'userName',
					halign: 'center',//表头居中
					align: 'center',//内容居中
					width: '120px',
					title: '用户名'
				}, {
					field: 'cityName',
					halign: 'center',//表头居中
					align: 'center',//内容居中
					width: '120px',
					title: '比赛城市'
				}, {
					field: 'power',
					halign: 'center',//表头居中
					align: 'center',//内容居中
					title: '推荐力收益(总)',
					sortable:true
				}, {
					field: 'totalPromoters',
					halign: 'center',//表头居中
					align: 'center',//内容居中
					title: '推广人数(总)',
					sortable:true
				}, {
					field: 'seasonPromoters',
					halign: 'center',//表头居中
					align: 'center',//内容居中
					title: '推广人数(赛季)',
					sortable:true
				}, {
					field: 'favour',
					halign: 'center',//表头居中
					align: 'center',//内容居中
					title: '助力人数',
					sortable:true
				}],
				onSort: function (name, order) {
					console.log(name, order)
					$('#table' + index).bootstrapTable('refreshOptions', {
						sortName:name,
						sortOrder:order
					});
					// $('#table' + index).bootstrapTable('refresh');
				}
			});
		}
		//------------------------------------------------------------------------------------------------------------

		//======================================================== 点击事件 ==========================================
		// 折叠面板展开状态切换
		function registerCollapseEvent() {
			$('.collapse-icon').click(function () {
				let $this = $(this);
				$this.hide();
				$this.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
				let isCollapse = $this[0].classList.contains('fa-chevron-down');
				let $chooseCity = $('#chooseCity' + $this[0].id);
				if (isCollapse) {
					$chooseCity.hide();
				} else {
					$chooseCity.show();
				}
				setTimeout(function () {
					$this.show();
				}, 300)
			});
		}
		// 城市选择事件
		function registerCityChooseEvent() {
			$('.panel-cities span').click(function () {
				$(this).parent().find(".active").removeClass('active');
				$(this).toggleClass('active');
				let index = $(this).parent().parent().data("index");
				let cityName = $(this).data("value");
				$('#cityName' + index).val(cityName);
				$('#table' + index).bootstrapTable('refresh');
			});
		}
		// 城市展开事件
		function registerCityExpandEvent() {
			$('.cities-more').click(function () {
				let index = $(this).data('index');
				let $cities = $('.cities-expand' + index);
				if ($cities.is(":hidden")) {
					$cities.show();
					$('.cities-more' + index)[0].innerHTML = '收起';
				} else {
					$cities.hide();
					$('.cities-more' + index)[0].innerHTML = '显示全部';
				}
			});
		}
		//------------------------------------------------------------------------------------------------------------

		$("#article_reset_btn").click(function() {
			$("#cityName").val("").trigger("change");
		});

		function confirmForm(text) {
			layer.alert(text, function(index) {
				reloadTable();
				layer.close(index);
			});
		}
	</script>

</body>

</html>

```