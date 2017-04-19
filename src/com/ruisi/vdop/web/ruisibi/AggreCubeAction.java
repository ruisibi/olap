package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;
import java.sql.SQLException;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import com.ruisi.vdop.ser.ruisibi.AggreCubeService;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.util.VDOPUtils;

/**
 * 通过原始数据聚集立方体
 * @author hq
 * @date 2014-11-12
 */
public class AggreCubeAction {
	
	private String cube;
	private String dset;
	private String dsource;
	
	private String fileId;
	private String cubeId;
	
	public String execute() throws IOException, SQLException{
		JSONObject cubej = JSONObject.fromObject(cube);
		JSONObject dsetj = JSONObject.fromObject(dset);
		JSONObject dsourcej = JSONObject.fromObject(dsource);
		AggreCubeService as = new AggreCubeService(cubej, dsetj, dsourcej);
		String tname = as.proces();
		//把表格写回数据
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		resp.getWriter().print(tname);
		return null;
	}
	
	/**
	 * 通过接口自动聚集
	 * @return
	 * @throws IOException
	 * @throws ClassNotFoundException
	 * @throws SQLException 
	 */
	public String autoAggre() throws IOException, ClassNotFoundException, SQLException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		JSONObject info = fs.getCubeInfo(fileId, cubeId, 1);
		JSONObject cubej = info.getJSONObject("cube");
		JSONObject dsetj = info.getJSONObject("dataset");
		JSONObject dsourcej = info.getJSONObject("dsource");
		AggreCubeService as = new AggreCubeService(cubej, dsetj, dsourcej);
		String tname = as.proces();
		//把表格写回数据
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		resp.getWriter().print(tname);
		return null;
	}
	
	public String getCube() {
		return cube;
	}



	public String getDset() {
		return dset;
	}



	public String getDsource() {
		return dsource;
	}



	public void setCube(String cube) {
		this.cube = cube;
	}



	public void setDset(String dset) {
		this.dset = dset;
	}



	public void setDsource(String dsource) {
		this.dsource = dsource;
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
