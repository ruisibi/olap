package com.ruisi.vdop.web.frame;

import java.io.IOException;

import com.ruisi.vdop.util.VDOPUtils;

public class OnlineUserAction {

	public String execute() throws IOException{
		int ret = VDOPUtils.getOnlineUser(VDOPUtils.getServletContext());
		VDOPUtils.getResponse().getWriter().print(ret);
		return null;
	}
}
