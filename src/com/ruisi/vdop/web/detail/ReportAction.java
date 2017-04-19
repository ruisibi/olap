package com.ruisi.vdop.web.detail;

import java.io.IOException;
import java.util.Date;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import com.ruisi.vdop.bean.ReportVO;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.util.VDOPUtils;

public class ReportAction {
	
	private String userid;
	private String pageId; //页面ID
	private String pageInfo;
	private String pageName; //页面名称
	private String view; //当前是浏览状态还是管理状态
	private String msg; //错误信息
	private Integer open; //是否显示打开对话框
	
	public String execute() throws IOException, ClassNotFoundException{
		if(pageId != null && pageId.length() > 0){
			FileService fs = new FileService(VDOPUtils.getServletContext());
			ReportVO vo = fs.readReport(this.pageId, false, 2);
			if(vo == null){
				this.msg = "您请求的文件不存在，可能已经被删除了。";
			}else{
				this.pageInfo = vo.getPageInfo();
				this.pageName = vo.getPageName();
			}
		}
		return "success";
	}
	
	public String save() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		this.userid = VDOPUtils.getLoginedUser().getUserId();
		//this.userid = "admin";
		if(pageId == null || pageId.length() == 0){
			this.pageId = VDOPUtils.getUUIDStr();
			JSONObject page = JSONObject.fromObject(this.pageInfo);
			page.put("id", this.pageId);
			this.pageInfo = page.toString();
			ReportVO rvo = new ReportVO();
			rvo.setCrtdate(new Date());
			rvo.setUpdatedate(new Date());
			rvo.setPageId(pageId);
			rvo.setPageInfo(pageInfo);
			rvo.setPageName(pageName);
			rvo.setUserid(userid);
			fs.insertReport(rvo, "true".equalsIgnoreCase(view), 2);
		}else{
			ReportVO rvo = new ReportVO();
			rvo.setPageId(pageId);
			rvo.setPageInfo(pageInfo);
			rvo.setUpdatedate(new Date());
			fs.updateReport(rvo, "true".equalsIgnoreCase(view), 2);
		}
		
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		
		resp.getWriter().print(pageId);
		
		return null;
	}

	public String getUserid() {
		return userid;
	}

	public String getPageId() {
		return pageId;
	}

	public String getPageInfo() {
		return pageInfo;
	}

	public String getPageName() {
		return pageName;
	}

	public String getView() {
		return view;
	}

	public void setUserid(String userid) {
		this.userid = userid;
	}

	public void setPageId(String pageId) {
		this.pageId = pageId;
	}

	public void setPageInfo(String pageInfo) {
		this.pageInfo = pageInfo;
	}

	public void setPageName(String pageName) {
		this.pageName = pageName;
	}

	public void setView(String view) {
		this.view = view;
	}

	public String getMsg() {
		return msg;
	}

	public void setMsg(String msg) {
		this.msg = msg;
	}

	public Integer getOpen() {
		return open;
	}

	public void setOpen(Integer open) {
		this.open = open;
	}
	
}
