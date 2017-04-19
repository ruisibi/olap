package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;
import java.util.List;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.vdop.bean.ReportVO;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.util.VDOPUtils;

public class CubeAction {
	
	private String fileId;
	private String cubeId;
	
	//返回全部CUBE
	public String getAllCubes() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		List<ReportVO> ls = fs.listAllReport(false, 1);
		List ret = fs.listCubes(ls, false);
		VDOPUtils.getResponse().setContentType("text/html; charset=UTF-8");
		VDOPUtils.getResponse().getWriter().print(JSONArray.fromObject(ret));
		return null;
	}
	
	//返回全部授权后的CUBE
	public String getAllAuthCubes() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		List<ReportVO> ls = fs.listAllReport(false, 1);
		List ret = fs.listCubes(ls, true);
		VDOPUtils.getResponse().setContentType("text/html; charset=UTF-8");
		VDOPUtils.getResponse().getWriter().print(JSONArray.fromObject(ret));
		return null;
	}
	
	public String getCubeInfo() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		JSONObject info = fs.getCubeInfo(fileId, cubeId, 1);
		VDOPUtils.getResponse().setContentType("text/html; charset=UTF-8");
		VDOPUtils.getResponse().getWriter().print(info);
		return null;
	}

	public String getFileId() {
		return fileId;
	}

	public String getCubeId() {
		return cubeId;
	}

	public void setFileId(String fileId) {
		this.fileId = fileId;
	}

	public void setCubeId(String cubeId) {
		this.cubeId = cubeId;
	}
	
	
}
