package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.vdop.bean.ReportVO;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.ser.ruisibi.ReportService;
import com.ruisi.vdop.ser.utils.CompPreviewService;
import com.ruisi.vdop.util.VDOPUtils;

/**
 * 智能报表 设计页面
 * @author hq
 * @date 2013-11-19
 */
public class ReportDesignAction {
	
	private String pageInfo;
	
	private String userid;
	
	private String pageId; //页面ID
	
	private String pageName; //页面名称
	
	private String share; //是否是共享文件
	
	private String msg; //错误信息
	
	private String view; //当前是浏览状态还是管理状态
	
	private Integer open; //是否显示打开对话框

	public String save() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		this.userid = VDOPUtils.getLoginedUser().getUserId();
		//this.userid = "admin";
		int ret;
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
			ret = fs.insertReport(rvo, "true".equalsIgnoreCase(view), 1);
		}else{
			ReportVO rvo = new ReportVO();
			rvo.setPageId(pageId);
			rvo.setPageInfo(pageInfo);
			rvo.setUpdatedate(new Date());
			ret = fs.updateReport(rvo, "true".equalsIgnoreCase(view), 1);
		}
		
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		Map m = new HashMap();
		if(ret == 1){
			m.put("state", 1);
			m.put("msg", "文件已经不存在。");
		}else{
			m.put("state", 0);
			m.put("pageId", pageId);
		}
		
		resp.getWriter().print(JSONObject.fromObject(m));
		
		return null;
	}
	
	//管理员页面
	public String execute() throws IOException, ClassNotFoundException{
		if(pageId != null && pageId.length() > 0){
			FileService fs = new FileService(VDOPUtils.getServletContext());
			ReportVO vo = fs.readReport(this.pageId, false, 1);
			if(vo == null){
				this.msg = "您请求的文件不存在，可能已经被删除了。";
			}else{
				this.pageInfo = vo.getPageInfo();
				this.pageName = vo.getPageName();
				/**
				JSONObject json = JSONObject.fromObject(pageInfo);
				String linkReport = (String)json.get("linkReport");
				if(linkReport != null && linkReport.length() > 0){
					ReportVO nvo = fs.readReport(linkReport, false, 1);
					JSONObject njson  = JSONObject.fromObject(nvo.getPageInfo());
					json.put("datasource", njson.get("datasource"));
					json.put("dataset", njson.get("dataset"));
					json.put("cube", njson.get("cube"));
					this.pageInfo = json.toString();
				}
				**/
			}
		}
		return "success";
	}
	//浏览者页面
	public String view() throws IOException, ClassNotFoundException {
		if(pageId != null && pageId.length() > 0){
			FileService fs = new FileService(VDOPUtils.getServletContext());
			ReportVO vo = fs.readReport(this.pageId, true, 1);
			if(vo == null){
				this.share = "y";
				vo = fs.readShareReport(this.pageId, 1);
			}
			if(vo == null){
				this.msg = "您请求的文件不存在，可能已经被删除了。";
			}else{
				this.pageInfo = vo.getPageInfo();
				this.pageName = vo.getPageName();
				/**
				JSONObject json = JSONObject.fromObject(pageInfo);
				String linkReport = (String)json.get("linkReport");
				if(linkReport != null && linkReport.length() > 0){
					ReportVO nvo = fs.readReport(linkReport, false, 1);
					JSONObject njson  = JSONObject.fromObject(nvo.getPageInfo());
					json.put("datasource", njson.get("datasource"));
					json.put("dataset", njson.get("dataset"));
					json.put("cube", njson.get("cube"));
					this.pageInfo = json.toString();
				}
				**/
			}
		}
		return "view";
	}
	
	public String print() throws Exception{
		ExtContext.getInstance().removeMV(ReportService.deftMvId);
		JSONObject rjson = JSONObject.fromObject(this.pageInfo);
		ReportService tser = new ReportService();
		MVContext mv = tser.json2MV(rjson);
		
		CompPreviewService ser = new CompPreviewService();
		ser.setParams(null);
		ser.initPreview();
		
		String ret = ser.buildMV(mv);
		VDOPUtils.getRequest().setAttribute("data", ret);
		
		return "print";
	}

	public String getPageInfo() {
		return pageInfo;
	}

	public void setPageInfo(String pageInfo) {
		this.pageInfo = pageInfo;
	}

	public String getPageId() {
		return pageId;
	}


	public void setPageId(String pageId) {
		this.pageId = pageId;
	}

	public String getPageName() {
		return pageName;
	}

	public void setPageName(String pageName) {
		this.pageName = pageName;
	}

	public String getUserid() {
		return userid;
	}

	public void setUserid(String userid) {
		this.userid = userid;
	}

	public String getMsg() {
		return msg;
	}

	public void setMsg(String msg) {
		this.msg = msg;
	}
	
	public String getView() {
		return view;
	}

	public void setView(String view) {
		this.view = view;
	}

	public String getShare() {
		return share;
	}

	public void setShare(String share) {
		this.share = share;
	}

	public Integer getOpen() {
		return open;
	}

	public void setOpen(Integer open) {
		this.open = open;
	}
	
}
