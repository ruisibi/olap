package com.ruisi.vdop.web.ruisibi;

import java.io.IOException;

import com.ruisi.vdop.ser.utils.DBUtils;
import com.ruisi.vdop.ser.utils.DataService;
import com.ruisi.vdop.util.VDOPUtils;

public class DataAction {
	
	private String linktype;
	private String linkname;
	private String linkpwd;
	private String linkurl;
	private String dsname;
	
	private String jndiname;
	
	public String tree(){
		
		return null;
	}
	
	public String testJNDI() throws IOException{
		boolean ret = DBUtils.testJndi(this.jndiname);
		VDOPUtils.getResponse().setContentType("text/html; charset=UTF-8");
		VDOPUtils.getResponse().getWriter().print("{\"ret\":"+ret+"}");
		return null;
	}
	
	public String testConn() throws IOException{
		String clazz = "";
		if(linktype.equals("mysql")){
			clazz = DataService.mysql;
		}else if(linktype.equals("oracle")){
			clazz = DataService.oracle;
		}else if(linktype.equals("sqlserver")){
			clazz = DataService.sqlserver;
		}
		boolean ret = DBUtils.testConnection(linkurl, linkname, linkpwd, clazz);
		VDOPUtils.getResponse().setContentType("text/html; charset=UTF-8");
		VDOPUtils.getResponse().getWriter().print("{\"ret\":"+ret+"}");
		return null;
	}

	public String getLinktype() {
		return linktype;
	}

	public String getLinkname() {
		return linkname;
	}

	public String getLinkpwd() {
		return linkpwd;
	}

	public void setLinktype(String linktype) {
		this.linktype = linktype;
	}

	public void setLinkname(String linkname) {
		this.linkname = linkname;
	}

	public void setLinkpwd(String linkpwd) {
		this.linkpwd = linkpwd;
	}

	public String getLinkurl() {
		return linkurl;
	}

	public void setLinkurl(String linkurl) {
		this.linkurl = linkurl;
	}

	public String getDsname() {
		return dsname;
	}

	public void setDsname(String dsname) {
		this.dsname = dsname;
	}



	public String getJndiname() {
		return jndiname;
	}



	public void setJndiname(String jndiname) {
		this.jndiname = jndiname;
	}
}
