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
var curTmpInfo = {"view":false}; //临时对象
curTmpInfo.isupdate = false; //页面是否已经修改
$(function(){
	//初始化页面
	initpage();
	//判断是否有msg信息
	<s:if test="msg != null && msg !=''">
	showmsg('${msg}');
	</s:if>
	//判断是否打开报表
	<s:if test="open == 1">
	openreport(false);
	</s:if>
});

</script>

<body class="easyui-layout">

	<div region="north" border="false">
		<div class="panel-header">
            <a href="javascript:openreport(false);" id="mb8" class="easyui-linkbutton" plain="true" iconCls="icon-open">打开</a>
            <a href="javascript:newpage(false)" id="mb1" class="easyui-linkbutton" plain="true" iconCls="icon-newpage" >新建</a>
            <a href="javascript:;" menu="#saveinfo" id="mb2" class="easyui-menubutton" plain="true" iconCls="icon-save" >保存</a>
            <a href="javascript:selectcube();" id="mb3" class="easyui-linkbutton" plain="true" iconCls="icon-dataset">数据</a>
            <a href="javascript:;" id="mb5" menu="#insertdsinfo" class="easyui-menubutton" plain="true" iconCls="icon-model">建模</a>
            <a href="javascript:void(0)" id="mb4" class="easyui-menubutton" plain="true" iconCls="icon-add" menu="#insertcompmenu" >插入</a>
            <a href="javascript:exportPage()" id="mb6" class="easyui-linkbutton" plain="true" iconCls="icon-export" >导出</a>
            <a href="javascript:printData()" id="mb10" class="easyui-linkbutton" plain="true" iconCls="icon-print" >打印</a>
            <a href="javascript:kpidesc()" id="mb11" class="easyui-linkbutton" plain="true" iconCls="icon-kpidesc" >解释</a>
            <a href="javascript:helper()" id="mb7" class="easyui-linkbutton" plain="true" iconCls="icon-help" >帮助</a>
        </div>
    </div>
	
	<div region="west" split="true" style="width:220px;" title="对象浏览">
    	<div id="l_tab" class="easyui-tabs" style="height:auto; width:auto;">
        	<div title="数据" style="">
        		<ul id="selectdatatree" class="easyui-tree"></ul>
            </div>
            <div title="模型" style="">
        		<ul id="mydatatree" class="easyui-tree"></ul>
            </div>
            <div title="报表" style="">
            	<ul id="myreporttree" class="easyui-tree">
				</ul>  
            </div>
            <div title="视图" style="">
            	<ul id="viewtree" class="easyui-tree">
				</ul>  
            </div>
        </div>
        
    </div>
    
    <div data-options="region:'south',border:false" style="height:26px; color:#333; overflow:hidden; background-color:#E6EEF8;">
    	<div class="pfooter">
            <div align="left" style="float:left; margin:3px 0px 0px 10px;">
                 建议使用Firefox、 Chrome、 IE9及以上版本浏览器，体验最佳效果
            </div>
            <div style="float:right; margin: 3px 20px 0px 0px;">
                <a href="http://www.ruisitech.com" target="_blank" style="text-decoration:underline">北京睿思科技有限公司(www.ruisitech.com)</a> 版权所有
            </div>
        </div>
    </div>
    
	<div region="center" title="操作区" style="padding:5px;" id="optarea">
     <div id="p_param" class="param" tp="param">
     <div class="ptabhelpr">
     	拖拽维度到此处作为页面参数
     </div>
     </div>
	</div>

<div id="insertcompmenu" style="width:150px;">
		<div onclick="insertTable()" >插入表格</div>
		<div onclick="insertChart()" >插入图形...</div>
        <div onclick="insertText('insert')">插入文本...</div>
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
<div id="myreportmenu" class="easyui-menu">
	<div id="m_share" onclick="shareReport('y')">共享</div>
    <div id="m_share2" onclick="shareReport('n')">取消共享</div>
	<div onclick="deletemyreport()">删除</div>
    <div onclick="chgreportname()">重命名...</div>
</div>
<div id="insertdsinfo" style="width:150px;">
		<div onclick="newdatasource(false)" >创建数据源...</div>
		<div onclick="newdataset()" >创建数据集...</div>
        <div onclick="newcube()">创建立方体...</div>
</div>
<div id="saveinfo" style="width:150px;">
		<div onclick="savepage(false)" >保存</div>
		<div onclick="saveas(false)" >另存...</div>
</div>
<!-- 数据 操作菜单 -->
<div id="mydatasetmenu" class="easyui-menu">
	<div id="dataset_add" onclick="newdatactx()">新建...</div>
	<div id="dataset_mod" onclick="editmydata()">编辑...</div>
	<div id="dataset_del" onclick="deletemydata()">删除</div>
</div>
</body>
</html>