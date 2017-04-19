package com.ruisi.vdop.ser.job;

import static org.quartz.CronScheduleBuilder.cronSchedule;
import static org.quartz.JobBuilder.newJob;
import static org.quartz.TriggerBuilder.newTrigger;

import java.util.List;

import javax.servlet.ServletContext;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.quartz.CronTrigger;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SchedulerFactory;
import org.quartz.TriggerKey;
import org.quartz.impl.StdSchedulerFactory;

import com.ruisi.vdop.bean.ReportVO;
import com.ruisi.vdop.ser.ruisibi.FileService;
import com.ruisi.vdop.ser.ruisibi.ReportService;

/**
 * 定时任务管理器
 * 
 * @author hq
 * @date 2015-4-4
 */
public class JobManager {
	
	private static SchedulerFactory sf = null;
	private static Scheduler sched = null;
	
	static {
		if(sf == null){
			sf = new StdSchedulerFactory();
		}
		try {
			if(sched == null){
				sched = sf.getScheduler();
				sched.start();
			}
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
	
	public void shutdown(){
		try {
			if(sched != null){
				sched.shutdown();
			}
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}
	
	public void stopJob(String reportId, String cubeId){
		try {
			JobKey key = new JobKey(cubeId, reportId);
			TriggerKey triggerKey = new TriggerKey(cubeId, reportId);  
			sched.deleteJob(key);
			sched.unscheduleJob(triggerKey);
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
	}

	/**
	 * 创建数据聚集定时任务的job
	 * @param json
	 * @param jobId
	 * @param ctx
	 * @param siteId
	 * @return
	 */
	public JobKey startJob(JSONObject json, ServletContext ctx, String reportId, String cubeId, JSONObject jobCfg) {
	     try {
			JobDetail job = newJob(Runner.class).withIdentity(cubeId, reportId).build();
			
			job.getJobDataMap().put("json", json);
			job.getJobDataMap().put("ctx", ctx);
			job.getJobDataMap().put("cubeId", cubeId);
			job.getJobDataMap().put("sctx", ctx);
			JSONObject cube = ReportService.findCubeById(json, cubeId);
			if(jobCfg == null){
				jobCfg = cube.getJSONObject("job");
			}
			String period = this.createPeriod(jobCfg);
			CronTrigger trigger = newTrigger().withIdentity(cubeId, reportId).withSchedule(cronSchedule(period)).build();
			sched.scheduleJob(job, trigger);
			
			JobKey key = job.getKey();
			return key;
		} catch (SchedulerException e) {
			e.printStackTrace();
		}
		return null;

	}
	
	/**
	 * 创建任务的执行周期
	 * @return
	 */
	private String createPeriod(JSONObject job){
		String period = job.getString("period");
		String hour = job.getString("hour");
		String minute = job.getString("minute");
		
		if(period.equals("day")){  //每天执行
			return "0 "+minute+" "+hour+" ? * * ";
		}else if("week".equals(period)){  //每周执行
			return "0 "+minute+" "+hour+" ? * "+job.getString("week");
		}else if("month".equals(period)){  //每月执行
			return "0 "+minute+" "+hour+" "+job.getString("day")+" * ?";
		}
		return null;
	}
	
	/**
	 * 在项目启动时，启动所有的运行中的JOB
	 * @param ctx
	 * @throws Exception 
	 */
	public void startAllJob(ServletContext ctx) throws Exception{
		FileService fs = new FileService(ctx);
		List<ReportVO> files = fs.listAllReport(false, 1);
		for(int i=0; i<files.size(); i++){
			ReportVO rvo = files.get(i);
			JSONObject json = JSONObject.fromObject(rvo.getPageInfo());
			String reportId = json.getString("id");
			JSONArray cubes = (JSONArray)json.get("cube");
			if(cubes == null || cubes.size() == 0){
				continue;
			}
			for(int j=0; j<cubes.size(); j++){
				JSONObject cube = cubes.getJSONObject(j);
				JSONObject job = (JSONObject)cube.get("job");
				if(job == null || job.size() == 0){
					continue;
				}
				String cubeId = cube.getString("id");
				this.startJob(json, ctx, reportId, cubeId, null);
			}
		}
	}

}
