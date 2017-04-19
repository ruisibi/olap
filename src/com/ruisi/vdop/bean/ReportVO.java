package com.ruisi.vdop.bean;

import java.io.Serializable;
import java.util.Date;

public class ReportVO implements Serializable, Comparable<ReportVO>  {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1406735764078989428L;
	
	private String pageId;
	private String userid;
	private String pageInfo;
	private String pageName;
	private Date crtdate;
	private Date updatedate;
	private String share;  //是否共享 share = "y" 表示报表已共享
	@Override
	public int compareTo(ReportVO arg0) {
		return arg0.getCrtdate().compareTo(this.getCrtdate());
	}
	public String getPageId() {
		return pageId;
	}
	public String getUserid() {
		return userid;
	}
	public String getPageInfo() {
		return pageInfo;
	}
	public String getPageName() {
		return pageName;
	}
	public void setPageId(String pageId) {
		this.pageId = pageId;
	}
	public void setUserid(String userid) {
		this.userid = userid;
	}
	public void setPageInfo(String pageInfo) {
		this.pageInfo = pageInfo;
	}
	public void setPageName(String pageName) {
		this.pageName = pageName;
	}
	public Date getCrtdate() {
		return crtdate;
	}
	public Date getUpdatedate() {
		return updatedate;
	}
	public void setCrtdate(Date crtdate) {
		this.crtdate = crtdate;
	}
	public void setUpdatedate(Date updatedate) {
		this.updatedate = updatedate;
	}
	public String getShare() {
		return share;
	}
	public void setShare(String share) {
		this.share = share;
	}

}
