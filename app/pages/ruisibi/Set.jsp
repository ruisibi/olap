<%@ page language="java" contentType="text/html; charset=utf-8" import="java.util.*" pageEncoding="utf-8"%>
<%@ taglib prefix="s" uri="/struts-tags"%>
<%@ taglib prefix="bi" uri="/WEB-INF/common.tld"%>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	 <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
   <title>系统设置</title>
   <link rel="shortcut icon" type="image/x-icon" href="../resource/img/rs_favicon.ico">
   <script type="text/javascript" src="../ext-res/js/jquery.min.js"></script>
	<link rel="stylesheet" type="text/css" href="../ext-res/css/fonts-min.css" />
	<link rel="stylesheet" type="text/css" href="../ext-res/css/boncbase.css?v3" />
  	<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.3.4/themes/default/easyui.css">
	<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.3.4/themes/icon.css">
	<script type="text/javascript" src="../resource/jquery-easyui-1.3.4/jquery.easyui.min.js"></script>
   
</head>

<script language="javascript">
function cacheCube(){
	var sels = $("#cache input[name='rid']:checkbox:checked");
	var ids = "";
	sels.each(function(index, element) {
        ids = ids + $(this).val();
		if(index != sels.size() - 1){
			ids = ids + ",";
		}
    });
	if(ids == ""){
		alert("请勾选您要缓存的报表。");
		return;
	}
	$.ajax({
		type:"POST",
		url: "Cache.action",
		dataType:"html",
		data: {rids:ids},
		success: function(resp){
			alert(resp);
		}
	});
}
function cacheState(){
	$.ajax({
		type:"GET",
		url: "Cache!state.action",
		dataType:"html",
		success: function(resp){
			alert(resp);
		}
	});
}
</script>

<body>
<div class="bi_tit2">
系统设置
</div>

<div style="margin:5px;">
	<div id="cache" class="easyui-panel" title="数据缓存" style="width:500px;height:auto;padding:5px;" data-options="iconCls:'icon-save'">
		<p style="font-size:14px; padding-top:5px; margin-top:0px;">报表文件：</p>
		<ul>
        <%
		List ls = (List)request.getAttribute("ls");
		for(int i =0; i<ls.size(); i++){
			com.ruisi.vdop.bean.ReportVO vo = (com.ruisi.vdop.bean.ReportVO)ls.get(i);
        %>
			<div style="font-size:14px; margin:3px;"><input type="checkbox" id="rid" name="rid" value="<%=vo.getPageId()%>"><%=vo.getPageName()%></div>
		<%
		}
		%>
		</ul>
        <div align="right"><input type="button" value="缓存数据" onclick="cacheCube()"><input type="button" value="查看状态" onclick="cacheState()"></div>
	</div>
</div>

</body>
</html>