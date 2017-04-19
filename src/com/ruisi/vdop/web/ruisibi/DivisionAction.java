package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;
import java.sql.SQLException;

import com.ruisi.vdop.ser.ruisibi.DivisionCubeService;

import net.sf.json.JSONObject;

/**
 * 立方体分表
 * @author hq
 * @date 2017-4-17
 */
public class DivisionAction {

	private String cube;
	private String dset;
	private String dsource;
	private String division; //分表信息
	
	public String execute() throws IOException, SQLException{
		JSONObject cubej = JSONObject.fromObject(cube);
		JSONObject dsetj = JSONObject.fromObject(dset);
		JSONObject dsourcej = JSONObject.fromObject(dsource);
		JSONObject divisionj = JSONObject.fromObject(division);
		DivisionCubeService ds = new DivisionCubeService(cubej, dsetj, dsourcej, divisionj);
		ds.proces();
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

	public String getDivision() {
		return division;
	}

	public void setDivision(String division) {
		this.division = division;
	}
	
	
}
