<%@ page language="java" contentType="text/html; charset=utf-8"
    pageEncoding="utf-8"%>
<%@ taglib prefix="s" uri="/struts-tags"%>
<%@ taglib prefix="bi" uri="/WEB-INF/common.tld"%>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	 <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
   <title><s:if test="pageName != null && pageName !=''">${pageName} - </s:if>睿思BI|明细查询</title>
   <link rel="shortcut icon" type="image/x-icon" href="../resource/img/rs_favicon.ico">
   <script type="text/javascript" src="../ext-res/js/jquery.min.js"></script>
	<link rel="stylesheet" type="text/css" href="../ext-res/css/fonts-min.css" />
	<link rel="stylesheet" type="text/css" href="../ext-res/css/boncbase.css?v3" />
	<link rel="stylesheet" type="text/css" href="../resource/css/bireport.css?v3" />
	<script language="javascript" src="../resource/js/json.js"></script>
    <script language="javascript" src="../resource/js/detail-report.js"></script>
    <script language="javascript" src="../resource/js/detail-data.js"></script>
    <script language="javascript" src="../resource/js/detail-chart.js"></script>
	<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.3.4/themes/default/easyui.css">
	<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.3.4/themes/icon.css">
	<script type="text/javascript" src="../resource/jquery-easyui-1.3.4/jquery.easyui.min.js"></script>
    <script type="text/javascript" src="../resource/jquery-easyui-1.3.4/locale/easyui-lang-zh_CN.js"></script>
    <script type="text/javascript" src="../ext-res/js/echarts.min.js"></script>
	<script type="text/javascript" src="../ext-res/My97DatePicker/WdatePicker.js"></script>
   
</head>

<script language="javascript">
	<%
String pageInfo = (String)request.getAttribute("pageInfo");
if(pageInfo == null){
	%>
	var pageInfo = {};
	var isnewpage = true;
	<%
}else{
%>
	var pageInfo = <%=pageInfo%>;
	var isnewpage = false;
<%}%>
	var curTmpInfo = {"view":false, isupdate: false}; //临时对象
	$(function(){
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

	<div region="north" border="false" style="height:65px;background:#E6EEF8;padding:1px">
		<div class="bi_tit2">
        <s:if test="pageName != null && pageName !=''">${pageName} - </s:if>
        睿思BI|明细查询
		</div>
        
        <div class="panel-header" style="padding:3px;">
            <a href="javascript:openreport(false);" id="mb8" class="easyui-linkbutton" plain="true" iconCls="icon-open">打开</a>
            <a href="javascript:newpage(false)" id="mb1" class="easyui-linkbutton" plain="true" iconCls="icon-newpage" >新建</a>
            <a href="javascript:;" menu="#saveinfo" id="mb2" class="easyui-menubutton" plain="true" iconCls="icon-save" >保存</a>
            <a href="javascript:selectdset();" id="mb3" class="easyui-linkbutton" plain="true" iconCls="icon-dataset">数据</a>
            <a href="javascript:insertChart();" id="mb3" class="easyui-linkbutton" plain="true" iconCls="icon-chart">图形</a>
            <a href="javascript:;" id="mb5" menu="#insertdsinfo" class="easyui-menubutton" plain="true" iconCls="icon-model">建模</a>
            <a href="javascript:exportPage()" id="mb6" class="easyui-linkbutton" plain="true" iconCls="icon-export" >导出</a>
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
        </div>
        
    </div>
    
    <div data-options="region:'south',border:false" style="height:26px; color:#333; overflow:hidden; background-color:#E6EEF8;">
    	<div class="pfooter">
            <div align="left" style="float:left; margin:3px 0px 0px 10px;">
                 建议使用Firefox、 Chrome、 IE8及以上版本浏览器，体验最佳效果
            </div>
            <div style="float:right; margin: 3px 20px 0px 0px;">
                <a href="http://www.ruisitech.com" target="_blank" style="text-decoration:underline">北京睿思科技有限公司(www.ruisitech.com)</a> 版权所有
            </div>
        </div>
    </div>
    
	<div region="center" title="操作区" style="padding:5px;" id="optarea">
     <div id="p_param" class="param" tp="param">
     <div class="ptabhelpr">
     	拖拽字段到此处作为页面参数
     </div>
     </div>
     <div id="T2" class="comp_table"></div>
     <div id="chart_div"></div>
	</div>

<div id="saveinfo" style="width:150px;">
    <div onclick="savepage(false)" >保存</div>
    <div onclick="saveas(false)" >另存...</div>
</div>
<div id="insertdsinfo" style="width:150px;">
		<div onclick="newdatasource(false)" >创建数据源...</div>
		<div onclick="newdataset()" >创建数据集...</div>
</div>
<div id="pdailog"></div>
<!-- 数据 操作菜单 -->
<div id="mydatasetmenu" class="easyui-menu">
	<div id="dataset_add" onclick="newdatactx()">新建...</div>
	<div id="dataset_mod" onclick="editmydata()">编辑...</div>
	<div id="dataset_del" onclick="deletemydata()">删除</div>
</div>
<div id="myreportmenu" class="easyui-menu">
	<div id="m_share" onclick="shareReport('y')">共享</div>
    <div id="m_share2" onclick="shareReport('n')">取消共享</div>
	<div onclick="deletemyreport()">删除</div>
    <div onclick="chgreportname()">重命名...</div>
</div>
<div id="gridoptmenu" class="easyui-menu">
    <div>
    <span>排序</span>
    <div style="width:120px;">
    	<div id="col_ord1" onclick="gridColsort('asc')">升序</div>
        <div id="col_ord2"  onclick="gridColsort('desc')">降序</div>
        <div id="col_ord3" iconCls="icon-ok" onclick="gridColsort('')">默认</div>
    </div>
    </div>
    <div>
    <span>移动</span>
    <div style="width:120px;">
    	<div iconCls="icon-back" onclick="tableColmove('left')">左移</div>
        <div iconCls="icon-right" onclick="tableColmove('right')">右移</div>
    </div>
    </div>
    <div onclick="delTableCol()" iconCls="icon-remove">删除</div>
</div>
<div id="aggretypemenu" class="easyui-menu">
	<div iconCls="icon-blank" id="aggre_count" onclick="kpiAggreType('count')">计数</div>
	<div iconCls="icon-blank" id="aggre_sum" onclick="kpiAggreType('sum')">求和</div>
    <div iconCls="icon-blank" id="aggre_avg" onclick="kpiAggreType('avg')">求平均</div>
    <div iconCls="icon-blank" id="aggre_max" onclick="kpiAggreType('max')">最大值</div>
    <div iconCls="icon-blank" id="aggre_min" onclick="kpiAggreType('min')">最小值</div>
</div>
<div class='chartloading' id="Cloading"><div class="ldclose" onclick="hideLoading()"></div><div class="ltxt">Loading...</div></div>
</body>
</html>