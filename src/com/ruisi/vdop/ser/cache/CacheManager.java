package com.ruisi.vdop.ser.cache;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.List;

import javax.servlet.ServletContext;

/**
 * 立方体数据缓存管理类
 * @author hq
 * @date 2014-11-13
 */
public class CacheManager {
	
	private String path = "/cache/";
	private ServletContext servletContext;
		
	private static CacheManager manager = null;
	
	private CacheManager(ServletContext servletContext){
		this.servletContext = servletContext;
	}
	
	public synchronized static void createInstance(ServletContext servletContext){
		if(manager != null){
			return;
		}
		manager = new CacheManager(servletContext);
		manager.init();
	}
	
	public synchronized static CacheManager getInstance(){
		if(manager == null){
			throw new RuntimeException("cache 对象还未缓存。");
		}
		return manager;
	}
	
	/**
	 * 把缓存对象写入文件
	 * 
	 * 缓存文件路径为 ：cache/cubeId/维度数量/缓存文件名 的路径
	 */
	public synchronized void putCache(CacheKeyVO keyVO, List datas) throws Exception{
		String key = keyVO.createKey();		
		String file = this.path + "/" + keyVO.getCubeId() + "/" + keyVO.getDimsize() + "/" + key;
		File f = new File(this.path + "/" + keyVO.getCubeId() + "/" + keyVO.getDimsize());
		if(!f.exists()){
			f.mkdirs();
		}
		FileOutputStream fos = new FileOutputStream(file);
		ObjectOutputStream oout = new ObjectOutputStream(fos);
		oout.writeObject(datas);
		oout.close();
		fos.close();
	}
	
	/**
	 * 从缓存对象读取文件
	 * 
	 * 缓存文件路径为 ：cache/cubeId/维度数量/缓存文件名 的路径
	 * @throws Exception 
	 */
	public synchronized List getCache(CacheKeyVO keyVO) throws Exception{
		int size = keyVO.getDimsize();
		String key = keyVO.createKey();
		File f = new File(this.path + "/" + keyVO.getCubeId() + "/" + size + "/" + key);
		if(f.exists()){
			return this.getData(f, size);
		}else{
			return null;
		}
	}

	private void init(){
		String p = this.servletContext.getRealPath("/");
		p = p + path;
		this.path = p;  //回写给P
		/**
		File f = new File(p);   //把缓存的文件对象加载到map中
		if(!f.exists()){
			f.mkdirs();
		}
		for(File tmp : f.listFiles()){
			if(tmp.exists()){
				File[] files = tmp.listFiles();
				for(File sub : files){
					this.files.put(sub.getName(), "");
				}
			}
		}
		**/
	}
	
	private List getData(File file, int dimsize) throws Exception{
		FileInputStream fis = new FileInputStream(file);
		ObjectInputStream  ois = new ObjectInputStream(fis);
		List ls  = (List)ois.readObject();
		ois.close();
		fis.close();
		return ls;
	}
}
