package com.ruisi.vdop.util;

import javax.servlet.ServletContext;

import org.apache.struts2.ServletActionContext;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

import com.ruisi.ext.engine.dao.DaoHelper;

public class SpringUtil {
	/**获取spring容器
	 * 
	 * */
	public static ApplicationContext getApplicationContext(ServletContext sc){
		return WebApplicationContextUtils.getWebApplicationContext(sc);
	}
	
	public static DaoHelper getDaoHelper(){
		return (DaoHelper)SpringUtil.getApplicationContext(ServletActionContext.getServletContext()).getBean("daoHelper");
		
	}
	
}
