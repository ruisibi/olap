<%@page contentType="text/html; charset=UTF-8"%>
<%@page contentType="text/html; charset=UTF-8"%>

<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>睿思BI-OLAP系统 - 用户登录</title>
<link rel="shortcut icon" type="image/x-icon" href="resource/img/rs_favicon.ico">
<link href="ext-res/css/bootstrap.min.css" rel="stylesheet">
<link href="resource/css/style.css" rel="stylesheet">
<script type="text/javascript" src="ext-res/js/jquery.min.js"></script>
<script type="text/javascript" src="ext-res/js/bootstrap.min.js?v=3.3.6"></script>
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
   <table width="500" border="0" align="center" cellpadding="0" cellspacing="0">
    <tr>

      <td height="146" colspan="4" align="center"><img src="resource/img/rsyun.png"></td>
    </tr>
   
    <tr>
      <td width="82" rowspan="3" align="left">&nbsp;</td>
      <td width="46" height="43" align="left">帐号：</td>
      <td width="264" align="left"><input name="userName" type="text" class="form-control" value="${userName}" /></td>
      <td width="164" rowspan="3" align="left">&nbsp;</td>
    </tr>

    <tr>
      <td height="31" align="left">口令：</td>
      <td align="left"><input name="password" type="password" class="form-control"/></td>
    </tr>
    <tr>
      <td height="50" align="left">&nbsp;</td>
      <td align="left">
      <input name="button3" type="submit" class="btn btn-success m-b" id="button3" value="登 录" />  <br/>
	  账号/口令： admin/123456
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
   © <a href="http://www.ruisitech.com" target="_blank" >北京睿思科技有限公司</a> 2016 <a href="http://www.ruisitech.com" target="_blank" >联系我们</a></div>
</div>

</body>
</html>
