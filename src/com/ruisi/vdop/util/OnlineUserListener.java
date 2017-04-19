package com.ruisi.vdop.util;

import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionEvent;

/**
 * session 监听器，在SESSION失效的时候，移除在线用户数
 * @author hq
 * @date 2014-7-25
 */
public class OnlineUserListener implements javax.servlet.http.HttpSessionListener  {

	@Override
	public void sessionCreated(HttpSessionEvent arg0) {
	}

	@Override
	public void sessionDestroyed(HttpSessionEvent arg0) {
		HttpSession session = arg0.getSession();
		VDOPUtils.removeLoginUser(session.getServletContext(), session, false);
	}

}
