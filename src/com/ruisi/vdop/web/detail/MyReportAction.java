package com.ruisi.vdop.web.detail;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;

import com.ruisi.ext.engine.dao.DaoHelper;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.util.VDOPUtils;
import com.ruisi.vdop.bean.ReportVO;

public class MyReportAction {
	
	private DaoHelper daoHelper;
	
	private String userId;
	
	private String reportId;
	
	private String reportName; //改名后的名称
	
	private String view;
	
	private String id; 
	
	/**
	 * 共享报表
	 * @return
	 * @throws ClassNotFoundException 
	 * @throws IOException 
	 */
	public String share() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		ReportVO vo = fs.readReport(this.reportId, false, 2);
		vo.setShare("y");
		fs.updateReport(vo, false, 2);
		return null;
	}
	
	/**
	 * 停止共享报表
	 * @return
	 * @throws IOException
	 * @throws ClassNotFoundException
	 */
	public String unshare() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		ReportVO vo = fs.readReport(this.reportId, false, 2);
		vo.setShare("n");
		fs.updateReport(vo, false, 2);
		return null;
	}

	public String tree() throws IOException, ClassNotFoundException{
		if("sharereport".equals(id)){
			HttpServletResponse resp = VDOPUtils.getResponse();
			resp.setContentType("text/xml; charset=UTF-8");
			resp.getWriter().println("[]");
			return null;
		}
		String userId = VDOPUtils.getLoginedUser().getUserId();
		FileService fs = new FileService(VDOPUtils.getServletContext());
		boolean auth = VDOPUtils.getLoginedUser().isAdmin() ? false : true; //管理员不鉴权，一般用户才鉴权
		List<ReportVO> ls = fs.listReport("true".equalsIgnoreCase(view), userId, auth, 2);
		Collections.sort(ls);
		//转成json
		List ret = new ArrayList();
		for(int i=0; i<ls.size(); i++){
			ReportVO rvo = ls.get(i);
			Map m = new HashMap();
			m.put("id", rvo.getPageId());
			m.put("text", rvo.getPageName());
			if("y".equals(rvo.getShare())){
				m.put("iconCls", "icon-share");
			}
			Map attr = new HashMap();
			attr.put("share", rvo.getShare());
			m.put("attributes", attr);
			ret.add(m);
		}
		
		//如果view = true, 同时获取共享的报表
		if("true".equalsIgnoreCase(view)){
			List<ReportVO> sharels = fs.listShareReport(2);
			Map share = new HashMap();
			share.put("id", "sharereport");
			share.put("text", "共享报表");
			share.put("state", "closed");
			List child = new ArrayList();
			share.put("children", child);
			ret.add(0, share);
			for(int j=0; j<sharels.size(); j++){
				ReportVO svo = sharels.get(j);
				Map m = new HashMap();
				m.put("id", svo.getPageId());
				m.put("text", svo.getPageName());
				m.put("iconCls", "icon-share");
				Map att = new HashMap();
				att.put("sharefile", "y");
				m.put("attributes", att);
				child.add(m);
			}
			
		}
		String ctx = JSONArray.fromObject(ret).toString();
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/xml; charset=UTF-8");
		resp.getWriter().println(ctx);
		return null;
	}
	
	public String delete(){
		FileService fs = new FileService(VDOPUtils.getServletContext());
		fs.deleteReport(this.reportId, "true".equalsIgnoreCase(view), 2);
		return null;
	}
	
	public String rename() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		ReportVO rvo = new ReportVO();
		rvo.setPageId(this.reportId);
		rvo.setPageName(reportName);
		rvo.setUpdatedate(new Date());
		fs.updateReport(rvo, "true".equalsIgnoreCase(view), 2);
		return null;
	}
	
	public String list() throws IOException, ClassNotFoundException{
		String userId = VDOPUtils.getLoginedUser().getUserId();
		FileService fs = new FileService(VDOPUtils.getServletContext());
		boolean auth = VDOPUtils.getLoginedUser().isAdmin() ? false : true; //管理员不鉴权，一般用户才鉴权
		List<ReportVO> ls = fs.listReport("true".equalsIgnoreCase(view), userId, auth, 2);
		Collections.sort(ls);
		
		//如果view = true, 同时获取共享的报表
		if("true".equalsIgnoreCase(view)){
			List<ReportVO> sharels = fs.listShareReport(2);
			ls.addAll(0, sharels);
		}
		
		VDOPUtils.getRequest().setAttribute("ls", ls);
		return "list";
	}

	public DaoHelper getDaoHelper() {
		return daoHelper;
	}

	public void setDaoHelper(DaoHelper daoHelper) {
		this.daoHelper = daoHelper;
	}
	public String getReportId() {
		return reportId;
	}

	public void setReportId(String reportId) {
		this.reportId = reportId;
	}

	public String getReportName() {
		return reportName;
	}

	public void setReportName(String reportName) {
		this.reportName = reportName;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getView() {
		return view;
	}

	public void setView(String view) {
		this.view = view;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}
	
	
}
