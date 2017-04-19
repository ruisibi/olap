package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;

import org.quartz.JobKey;
import org.quartz.TriggerKey;

import net.sf.json.JSONObject;

import com.ruisi.vdop.bean.ReportVO;
import com.ruisi.vdop.ser.job.JobManager;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.util.VDOPUtils;


/**
 * 任务管理 Action
 * @author hq
 * @date 2017-2-24
 */
public class JobAction {
	
	private String fileId;
	private String cubeId;
	private String job; //job JsonObject
	
	public String startJob() throws IOException, ClassNotFoundException{
		FileService fs = new FileService(VDOPUtils.getServletContext());
		ReportVO rvo = fs.readReport(fileId, false, 1);
		JSONObject json = JSONObject.fromObject(rvo.getPageInfo());
		JobManager jm = new JobManager();
		//先移除JOB
		jm.stopJob(fileId, cubeId);
		JSONObject jobCfg = null;
		if(job != null && job.length() > 0){
			jobCfg = JSONObject.fromObject(job);
		}
		jm.startJob(json, VDOPUtils.getServletContext(), fileId, cubeId, jobCfg);
		return null;
	}
	
	public String stopJob(){
		JobManager jm = new JobManager();
		jm.stopJob(fileId, cubeId);
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

	public String getJob() {
		return job;
	}

	public void setJob(String job) {
		this.job = job;
	}
	
	
}
