<%@ page language="java" contentType="text/html; charset=utf-8"
    pageEncoding="utf-8"%>
<%@ taglib prefix="s" uri="/struts-tags"%>
<%@ taglib prefix="bi" uri="/WEB-INF/common.tld"%>
<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title><s:if test="pageName != null && pageName !=''">${pageName} - </s:if>睿思BI|OLAP多维分析</title>
<link rel="shortcut icon" type="image/x-icon" href="../resource/img/rs_favicon.ico">
<link href="../ext-res/css/bootstrap.min.css" rel="stylesheet">
<link href="../resource/css/style.css" rel="stylesheet">
<link href="../resource/css/font-awesome.min.css?v=4.4.0" rel="stylesheet">
<link href="../resource/awesome-bootstrap-checkbox/awesome-bootstrap-checkbox.css" rel="stylesheet">
<script type="text/javascript" src="../ext-res/js/jquery.min.js"></script>
<script type="text/javascript" src="../ext-res/js/bootstrap.min.js?v=3.3.6"></script>
<script language="javascript" src="../resource/js/bireport.js?v5"></script>
<script language="javascript" src="../resource/js/bidata.js?v5"></script>
<script language="javascript" src="../resource/js/bichart.js?v5"></script>
<script language="javascript" src="../resource/js/bidrill.js?v5"></script> 
<link rel="stylesheet" type="text/css" href="../resource/css/bireport.css?v3" />
<script type="text/javascript" src="../ext-res/My97DatePicker/WdatePicker.js"></script>
<script language="javascript" src="../resource/js/json.js"></script>
<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.4.4/themes/gray/easyui.css">
<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.4.4/themes/icon.css">
<script type="text/javascript" src="../resource/jquery-easyui-1.4.4/jquery.easyui.min.js"></script>
<script type="text/javascript" src="../ext-res/js/echarts.min.js"></script>
</head>

<script language="javascript">
<%
String pageInfo = (String)request.getAttribute("pageInfo");
if(pageInfo == null){
	%>
	var pageInfo = {comps:[{"name":"表格组件","id":1, "type":"table"}], params:[]};
	var isnewpage = true;
	<%
}else{
%>
	var pageInfo = <%=pageInfo%>;
	var isnewpage = false;
<%}%>
var curTmpInfo = {"view":true, "share":'${share}'}; //临时对象, share表示当前文件是共享文件
curTmpInfo.isupdate = false; //页面是否已经修改
$(function(){
	
	//初始化selectdatatree
	initselectDataTree();
	
	//初始化参数
	initparam();
	
	//初始化默认组件
	for(i=0;i<pageInfo.comps.length; i++){
		var t = pageInfo.comps[i];
		var str = t.type == 'text' ? t.text.replace(/\n/g,"<br>") : null;
		addComp(t.id, t.name, str, false, t.type, isnewpage ? null : t);
	}
	//判断是否有msg信息
	<s:if test="msg != null && msg !=''">
	showmsg('${msg}');
	</s:if>
	
	initOptareaWidth();
});

</script>
<body class="gray-bg">

<nav class="navbar navbar-default animated fadeInDown" role="navigation" style="margin-bottom:0px;">
    <div>
        <!--向左对齐-->
        <ul class="nav navbar-nav navbar-left">
		<li class="dropdown">
        	<a href="#"  class="dropdown-toggle" data-toggle="dropdown">
            	文件
                <b class="caret"></b>
            </a>
        	<ul class="dropdown-menu">
                <li><a href="javascript:openreport(true);">打开</a></li>
                <li><a href="javascript:newpage(true);">新建</a></li>
                <li><a href="javascript:savepage(true);">保存</a></li>
				<li><a href="javascript:saveas(true);">另存</a></li>
            </ul>
        </li>
		<li class="dropdown">
        	<a href="#"  class="dropdown-toggle" data-toggle="dropdown">
            	插入
                <b class="caret"></b>
            </a>
        	<ul class="dropdown-menu">
                <li><a href="javascript:insertTable();">表格</a></li>
                <li><a href="javascript:insertChart();">图形</a></li>
                <li><a href="javascript:insertText('insert');">文本</a></li>
            </ul>
        </li>
		<li><a href="javascript:exportPage();">导出</a></li>
		<li><a href="javascript:printData();">打印</a></li>
		<li><a href="javascript:kpidesc();">度量解释</a></li>
		<li><a href="javascript:helper();">帮助</a></li>
        </ul>
    </div>
</nav>

	
	<div class="wrapper wrapper-content">
		<div class="row">
			<div class="col-sm-3">
				<div class="ibox">
					<div class="ibox-title">
						<h5>数据模型</h5>
					</div>
					<div class="ibox-content">
						<button class="btn btn-block btn-primary" onclick="openreport(true)"><i class="fa fa-cube"></i> 选择模型</button>
						<p class="text-warning">拖拽数据到表格或图形中展现</p>
						<ul id="selectdatatree" class="easyui-tree"></ul>
					</div>
				</div>
			</div>
			
			<div class="col-sm-9">
				<div class="ibox">
					<div class="ibox-content">
						 <div id="p_param" class="param" tp="param">
							 <div class="ptabhelpr">
								拖拽维度到此处作为页面参数
							 </div>
							 </div>
					</div>
				</div>
				<div class="ibox" style="margin-bottom:0px;">
					<div class="ibox-content" id="optarea" style="overflow:auto;">
						 
					</div>
				</div>
			</div>
		</div>
	</div>

<div id="pdailog"></div>
<div class="indicator">==></div>
<div id="kpioptmenu" class="easyui-menu">
	<div>
    	<span>计算</span>
   	   <div style="width:120px;">
    	<div onclick="kpicompute('sq')">上期值</div>
        <div onclick="kpicompute('tq')">同期值</div>
        <div onclick="kpicompute('zje')">增减额</div>
        <div onclick="kpicompute('hb')">环比(%)</div>
        <div onclick="kpicompute('tb')">同比(%)</div>
        <div onclick="kpicompute('zb')">占比(%)</div>
       </div>
    </div>
	<div onclick="kpiproperty()">属性...</div>
    <div iconCls="icon-chart" onclick="crtChartfromTab()">图形...</div>
    <div iconCls="icon-filter" onclick="kpiFilter('table')">筛选...</div>
    <div>
    <span>排序</span>
    <div style="width:120px;">
    	<div id="k_kpi_ord1" onclick="kpisort('asc')">升序</div>
        <div id="k_kpi_ord2"  onclick="kpisort('desc')">降序</div>
        <div id="k_kpi_ord3" iconCls="icon-ok" onclick="kpisort('')">默认</div>
    </div>
    </div>
    <div iconCls="icon-remove" onclick="delJsonKpiOrDim('kpi')">删除</div>
</div>
<div id="dimoptmenu" class="easyui-menu">
<!--
	<div onclick="dimproperty()">属性...</div>
    -->
	<div onclick="dimsort('asc')">升序</div>
    <div onclick="dimsort('desc')">降序</div>
    <div>
    <span>移动</span>
    <div style="width:120px;">
    	<div iconCls="icon-back" onclick="dimmove('left')">左移</div>
        <div iconCls="icon-right" onclick="dimmove('right')">右移</div>
        <div id="m_moveto" onclick="dimexchange()">移至</div>
    </div>
    </div>
    <div iconCls="icon-reload" onclick="changecolrow(true)">行列互换</div>
    <div iconCls="icon-filter" onclick="filterDims()">筛选...</div>
    <div iconCls="icon-sum" onclick="aggreDim()" id="m_aggre">聚合...</div>
    <div onclick="delJsonKpiOrDim('dim')" iconCls="icon-remove">删除</div>
</div>
<div id="chartoptmenu" class="easyui-menu">
	<div onclick="chartsort('asc')">升序</div>
    <div onclick="chartsort('desc')">降序</div>
    <div iconCls="icon-filter" onclick="chartfilterDims()" >筛选...</div>
    <div onclick="setChartKpi()" id="m_set">属性...</div>
    <div onclick="delChartKpiOrDim()" iconCls="icon-remove">清除</div>
</div>

<!-- 数据 操作菜单 -->
<div id="mydatasetmenu" class="easyui-menu">
	<div id="dataset_add" onclick="newdatactx()">新建...</div>
	<div id="dataset_mod" onclick="editmydata()">编辑...</div>
	<div id="dataset_del" onclick="deletemydata()">删除</div>
</div>
<div id="drillmenu" class="easyui-menu"></div>
</body>
</html>