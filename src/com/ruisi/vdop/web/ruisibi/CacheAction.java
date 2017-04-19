package com.ruisi.vdop.web.ruisibi;

import java.io.File;
import java.io.IOException;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;

import com.ruisi.vdop.ser.cache.CacheCubeService;
import com.ruisi.vdop.ser.cache.CacheInfoVO;
import com.ruisi.vdop.ser.job.Runner;
import com.ruisi.vdop.util.VDOPUtils;

/**
 * 缓存立方体数据到文件系统
 * @author hq
 * @date 2014-10-31
 */
public class CacheAction {
	
	private static Logger log = Logger.getLogger(CacheAction.class);
	
	private String rids; //报表ID列表
	
	private String msg;
	
	private String cubeId; //立方体ID
	
	/**
	 * 删除用户缓存
	 * @return
	 * @throws Exception 
	 */
	public String delCache() throws Exception{
		if(cubeId == null || cubeId.length() == 0){
			throw new Exception("缺少参数 cubeId");
		}
		ServletContext sctx = VDOPUtils.getServletContext();
		String p = sctx.getRealPath("/") + "/cache/" + cubeId;
		File f = new File(p);
		if(f.exists()){
			try {
				FileUtils.deleteDirectory(f);
			} catch (IOException e) {
				log.error("删除缓存文件出错。", e);
			}
		}
		return null;
	}
	
	public String execute() throws Exception{
		//启动数据缓存线程
		CacheInfoVO info = CacheCubeService.getCacheInfo();
		if(info.isState()){
			//正在运行
			msg = "数据正在缓存中。";
		}else{
			CacheCubeService ser = new CacheCubeService(rids, VDOPUtils.getLoginedUser(), VDOPUtils.getServletContext());
			ser.start();
			msg = "启动缓存成功。";
		}
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		resp.getWriter().print(msg);
		return null;
	}
	
	public String state() throws IOException{
		CacheInfoVO info = CacheCubeService.getCacheInfo();
		if(info.isState()){
			msg = "数据正在缓存中, 已缓存 "+info.getCount()+" 条数据。";
		}else{
			msg = "缓存程序未执行。";
		}
		HttpServletResponse resp = VDOPUtils.getResponse();
		resp.setContentType("text/html; charset=UTF-8");
		resp.getWriter().print(msg);
		return null;
	}

	public String getRids() {
		return rids;
	}

	public void setRids(String rids) {
		this.rids = rids;
	}

	public String getMsg() {
		return msg;
	}

	public void setMsg(String msg) {
		this.msg = msg;
	}

	public String getCubeId() {
		return cubeId;
	}

	public void setCubeId(String cubeId) {
		this.cubeId = cubeId;
	}
	
	
}
