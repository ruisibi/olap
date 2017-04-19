<%@ page language="java" contentType="text/html; charset=utf-8" import="com.ruisi.ext.engine.ExtConstants"%>
<%@ taglib prefix="ext" uri="/WEB-INF/ext-runtime.tld" %>
 
 <%
 String is3g = request.getParameter("_3g");
 String returnJsp = request.getParameter(ExtConstants.returnJspFlag);
 if("false".equalsIgnoreCase(returnJsp)){
 %>
 	 <ext:display/>
 <%
}else{
 %>
 
 <%
 if("y".equals(is3g)){
  %>
  <!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <%
 }else{
 %>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
  <%}%>
    
    <title>Ext2</title>
    <base target="_self">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<script type="text/javascript" src="../ext-res/js/jquery.min.js"></script>
	<script language="javascript" src="../ext-res/js/ext-base.js"></script>
	<script language="javascript" src="../ext-res/js/FusionCharts.js"></script>
	<link rel="stylesheet" type="text/css" href="../ext-res/css/fonts-min.css" />
	<link rel="stylesheet" type="text/css" href="../ext-res/css/boncbase.css" />
  
	<script type="text/javascript" src="../ext-res/My97DatePicker/WdatePicker.js"></script>

	<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.3.4/themes/<%=("y".equals(is3g)?"gray":"default")%>/easyui.css">
	<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.3.4/themes/icon.css">
	<script type="text/javascript" src="../resource/jquery-easyui-1.3.4/jquery.easyui.min.js"></script>
	
	<script type="text/javascript" src="../ext-res/highcharts/highcharts.js"></script>
	<script type="text/javascript" src="../ext-res/highcharts/highcharts-more.js"></script>

	<script language="javascript" src="../ext-res/js/sortabletable.js"></script>
    
	
  </head>
 
  <body>
  
  <%
  /**
  %>
  
  <script language="javascript">
		document.write("<div id='initLoading' class='firstload'><img src='../ext-res/image/large-loading.gif'><br>加载中,请稍后...</div>");
		var doc = jQuery(document);
		var win = jQuery(window);
		var t = doc.scrollTop() + win.height()/2 - 100;
		var l = doc.scrollLeft() + win.width()/2 - 50;
		jQuery("#initLoading").css({'top':t, 'left':l});
		jQuery(function(){
			jQuery("#initLoading").remove();
		});
	</script>

  <%
  **/
  %>
   
    <ext:display/>
  </body>
</html>
<%
}
%>