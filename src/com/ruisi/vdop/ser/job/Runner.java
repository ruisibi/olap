package com.ruisi.vdop.ser.job;

import java.io.File;
import java.io.IOException;
import java.sql.SQLException;

import javax.servlet.ServletContext;

import net.sf.json.JSONObject;

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;

import com.ruisi.vdop.ser.ruisibi.AggreCubeService;
import com.ruisi.vdop.ser.ruisibi.DivisionCubeService;
import com.ruisi.vdop.ser.ruisibi.ReportService;

/**
 * 任务执行器
 * @author hq
 * @date 2015-4-3
 */
public class Runner implements Job  {
	
	private static Logger log = Logger.getLogger(Runner.class);
	
	private JSONObject json;
	
	private String cubeId;
	
	private ServletContext sctx;
	
	public Runner(){
		
	}
	
	public Runner(JSONObject json, String cubeId, ServletContext sctx){
		this.json = json;
		this.cubeId = cubeId;
		this.sctx = sctx;
	}
	
	
	
	@Override
	public void execute(JobExecutionContext arg0) {
		JobDataMap data = arg0.getJobDetail().getJobDataMap();
		this.json = (JSONObject)data.get("json");
		this.cubeId = (String)data.get("cubeId");
		this.sctx = (ServletContext)data.get("sctx");
		this.startJob();
	}



	public void startJob(){
		JSONObject cube = ReportService.findCubeById(json, this.cubeId);
		String datasetid = cube.getString("datasetid");
		JSONObject dset = ReportService.findDataSetById(json, datasetid);
		String dsid = dset.getString("dsid");
		JSONObject dsource = ReportService.findDataSourceById(json, dsid);
		String aggreTable = (String)cube.get("aggreTable");
		boolean fb = false;
		//重新创建子表
		JSONObject divison = (JSONObject)cube.get("divison");
		if(divison != null && !divison.isEmpty()){
			DivisionCubeService ds = new DivisionCubeService(cube, dset, dsource, divison);
			try {
				ds.proces();
				fb = true;
			} catch (SQLException e1) {
				log.error("生成立方体子表出错。", e1);
			}
		}
		
		//聚集立方体
		//如果使用了分表，则不需要再进行聚集
		if(aggreTable != null && aggreTable.length() > 0 && !fb){
			AggreCubeService s = new AggreCubeService(cube, dset, dsource);
			try {
				s.proces();
			} catch (SQLException e) {
				log.error("立方体聚集出错。", e);
			}
		}
		
		//删除立方体缓存
		String p = sctx.getRealPath("/") + "/cache/" + cubeId;
		File f = new File(p);
		if(f.exists()){
			try {
				FileUtils.deleteDirectory(f);
			} catch (IOException e) {
				log.error("删除缓存文件出错。", e);
			}
		}
	}

}
