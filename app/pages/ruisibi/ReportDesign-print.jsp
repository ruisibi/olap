<%@ page language="java" contentType="text/html; charset=utf-8"
    pageEncoding="utf-8"%>
<%@ taglib prefix="s" uri="/struts-tags"%>
<%@ taglib prefix="bi" uri="/WEB-INF/common.tld"%>
<!DOCTYPE html>
<html lang="en">
<head>
	 <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
   <title>报表打印 - 睿思BI - 多维分析工具（OLAP）</title>

    <script type="text/javascript" src="../ext-res/js/jquery.min.js"></script>
	<link href="../ext-res/css/bootstrap.min.css" rel="stylesheet">
<link href="../resource/css/style.css" rel="stylesheet">
<link href="../resource/css/font-awesome.min.css?v=4.4.0" rel="stylesheet">
	<script type="text/javascript" src="../ext-res/My97DatePicker/WdatePicker.js"></script>

	<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.4.4/themes/default/easyui.css">
	<link rel="stylesheet" type="text/css" href="../resource/jquery-easyui-1.4.4/themes/icon.css">
	<script type="text/javascript" src="../resource/jquery-easyui-1.4.4/jquery.easyui.min.js"></script>
	<script language="javascript" src="../ext-res/js/sortabletable.js"></script>
    <script type="text/javascript" src="../ext-res/js/echarts.min.js"></script>
	<script type="text/javascript" src="../ext-res/js/ext-base.js"></script>
   
</head>
<style>
.crossReport table tr th {
	width:130px;
}
table.grid3 {
	width:auto;
}
</style>

<script language="javascript">
jQuery(function(){
	var prt = function(){
		print();	
	}
	window.setTimeout(prt, 2000);
});
</script>

 <body style="margin:10px;">

${data}

</body>
</html>