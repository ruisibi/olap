package com.ruisi.vdop.ser.ruisibi;

import javax.servlet.ServletContextEvent;

import com.ruisi.ext.engine.control.ContextListener;
import com.ruisi.vdop.ser.job.JobManager;
import common.Logger;

public class AppInit implements ContextListener {
	
	private static Logger log = Logger.getLogger(AppInit.class);

	@Override
	public void contextDest(ServletContextEvent event) {
		JobManager jm = new JobManager();
		jm.shutdown();
	}

	@Override
	public void contextInit(ServletContextEvent event) {
		JobManager jm = new JobManager();
		try {
			jm.startAllJob(event.getServletContext());
		} catch (Exception e) {
			log.error("系统初始化出错。", e);
		}
	}

}
