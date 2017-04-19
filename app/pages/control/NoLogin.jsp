<%@ page language="java" pageEncoding="UTF-8" import="com.ruisi.ext.engine.ExtConstants"%>
<%@ page session="false" buffer="none" %>

<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
%>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
  <head>
    
    <title>未登录</title>
	
 <script type="text/javascript">
 
 	setTimeout(function(){
 		document.location.href='<%=path%>/Login.action';
 	},5000);
	
 </script>
 <style>
 <!--
.p_err {
	  width:400px;
	  margin:0 auto;
	   border: 1px solid #BBBBBB;
    border-radius: 8px 8px 8px 8px;
    box-shadow: 5px 5px 5px #DDDDDD;
	background-color:#FFF;
	line-height:20px;
	font-size:14px;
	height:60px;
  }
-->
 </style>
    
  </head>

 
  <body>
  <br/><br/><br/><br/>
  <div class="p_err" align="center">
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td><img style="margin:10px;" src="<%=path%>/resource/img/icon-error.gif"></td>
    <td>
    <div style="font-size: 16px; font-weight:bold; margin-bottom:5px; margin-top:10px;">您还未登录或登录信息已经失效，请重新登录。</div>
		<div style=""></div>
    </td>
  </tr>
</table>
	</div>
  </body>
</html>
