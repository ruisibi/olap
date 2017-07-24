<%@ page language="java" contentType="text/html; charset=utf-8"
    pageEncoding="utf-8"%>
<%@ taglib prefix="s" uri="/struts-tags"%>
<table class="grid3" id="T_report54" cellpadding="0" cellspacing="0">
<thead>
<tr class="scrollColThead" style="background-color:#FFF">
	<th width="10%" >序号</th>
	<th width="40%">报表名称</th>
	<th width="30%">来源</th>
	<th width="20%">修改时间</th>
</tr>
	<s:iterator var="e" value="#request.ls" status="statu">
<tr>
	<td class='kpiData1 grid3-td'><div class="radio radio-info radio-inline"><input type="radio" id="r${statu.index}" name="reportId" value="${e.pageId}" /><label for="r${statu.index}"> </label></div></td>	
 <td class='kpiData1 grid3-td' align="left">${e.pageName}</td>	
 <td class='kpiData1 grid3-td' align="center">
 <%
 com.ruisi.vdop.bean.ReportVO vo = (com.ruisi.vdop.bean.ReportVO)pageContext.findAttribute("e");
 if("y".equals(vo.getShare())){
	 out.print("共享");
 }else{
	 out.print("自定义");
 }
 %>
 </td>
 <td class='kpiData1 grid3-td' align="center"><s:date name="updatedate" format="yyyy-MM-dd" /></td>
</tr>
 </s:iterator>

</thead>
</table>