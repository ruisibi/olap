<%@page contentType="text/html; charset=UTF-8"%>
<%@page contentType="text/html; charset=UTF-8"%>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>睿思BI商业智能产品演示系统 - 用户登录</title>
<link rel="shortcut icon" type="image/x-icon" href="resource/img/rs_favicon.ico">

<link rel="stylesheet" href="resource/css/ht.css" type="text/css">
<script type="text/javascript" src="ext-res/js/jquery.js"></script>

<style type="text/css">
<!--
body  {
	margin-left: 0px;
	margin-top: 0px;
	margin-right: 0px;
	margin-bottom: 0px;
	font-family: "songti";
	font-size: 12px;
	background-image: url(resource/img/2loginback.gif);
}
-->
</style>
<script language="javascript">
function resetval(ff){
	ff.userName.value = "";
	ff.password.value = "";
}

if(window.top != window.self){
	window.top.location.href = 'Login.action'
}

function chkpw(ff){
	if(ff.userName.value == ''){
		alert('请输入账号！');
		return false;
	}
	if(ff.password.value == ''){
		alert('请输入口令！');
		return false;
	}
}
</script>
</head>

<body>

<div class="denglu " id="denglu">
		<form name="form1" method="post" action="Login!login.action" onsubmit="return chkpw(document.form1)">
   <table width="556" border="0" align="center" cellpadding="0" cellspacing="0">
    <tr>

      <td height="146" colspan="4" align="left">&nbsp;</td>
    </tr>
     <tr>
      <td height="18" align="left">&nbsp;</td>
      <td align="left">&nbsp;</td>
    </tr>
    <tr>
      <td width="82" rowspan="3" align="left">&nbsp;</td>
      <td width="46" height="43" align="left">帐号：</td>
      <td width="264" align="left"><input name="userName" type="text" size="24" style="height:20px; font-size:16px; width: 200px;" value="${userName}" /></td>
      <td width="164" rowspan="3" align="left">&nbsp;</td>
    </tr>

    <tr>
      <td height="31" align="left">口令：</td>
      <td align="left"><input name="password" type="password" size="24"  style="height:20px; font-size:16px; width: 200px;"/></td>
    </tr>
    <tr>
      <td height="32" align="left">&nbsp;</td>
      <td align="left">
      <input name="button3" type="submit" class="houtai1203-2-3" id="button3" value="登录" />
      <input name="button3" type="button" onclick="resetval(this.form)" class="houtai1203-2-3"  value="清空" />
      </td>
    </tr>

   
    <tr>

      <td height="62" align="left" colspan="4">
      	<%
      	String einfo = (String)request.getAttribute("errorInfo");
      	if(einfo != null && einfo.length() > 0){
      	%>
      	<script>
      		jQuery(function(){
      			alert("操作失败：${errorInfo}");
      		});
			window.setTimeout(function(){
				jQuery("#einfo_msg").remove();
			}, 5000);
      		
      		</script>
      <div align="center" id="einfo_msg" style="color:#F00; font-size:14px; margin:10px;">${errorInfo}</div>
      <%}%>
      </td>
    </tr>
  </table>
  </form>
  
  
  <div align="center" style="color:#666; font-size:14px; margin:20px;">
管理员登陆账号/口令： admin/123456 <br/>
   © <a href="http://www.ruisitech.com" target="_blank" style="color:#666; text-decoration:none">北京睿思科技有限公司</a> 2013 <a href="http://www.ruisitech.com" target="_blank" style="color:#666; text-decoration:underline">联系我们</a></div>
</div>

</body>
</html>
