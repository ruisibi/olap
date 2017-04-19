package com.ruisi.vdop.util;

import com.ruisi.ext.engine.view.context.ExtContext;

public class VdopConstant {
	public static final String USER_KEY_IN_SESSION = "session.user";
	public static final String USER_KEY_IN_SESSION_3G = "session.user.3g";
	public static final int ACTIVE_GAP_MINUTE=3;//更新访问日志间隔，分钟数
	public static final int MAX_NO_ACTIVE_MINUTE=30;
	
	public static final String USER_CNT = "user.cnt";
	
	public static final String site = "\\[site\\]";
	
	public static final String pushPath = "usave"; //用户推送的xml文件，放在该目录下
	
	private static String sysUser = null;
	
	public static String getSysUser(){
		if(sysUser == null){
			sysUser = ExtContext.getInstance().getConstant("sysUser");
		}
		return sysUser;
	}
}
