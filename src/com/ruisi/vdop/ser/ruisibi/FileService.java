package com.ruisi.vdop.ser.ruisibi;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import com.ruisi.vdop.bean.ReportVO;
import com.ruisi.vdop.util.VDOPUtils;
/**
 * 操作文件对象
 * @author hq
 * @date 2014-5-30
 */
public class FileService {
	
	private String path;
	private ServletContext stx;
	public final static String extNameHz = ".hz";  //汇总查询的扩展名, type == 1
	public final static String extNameMx = ".mx";  //明细查询的扩展名, type == 2
	
	public FileService(ServletContext stx){
		this.stx = stx;
		this.path = this.stx.getRealPath("/") + "/db/";
		String userPath = this.path + "user/";
		File f = new File(userPath);
		if(!f.exists()){
			f.mkdirs();   //路径为 /db/usr/, 如果没有路径，创建文件
		}
		
	}
	
	public void deleteReport(String name, boolean view, int type){
		String file = path + (view?"user/":"") + name;
		if(!name.endsWith(type == 1 ? extNameHz : extNameMx)){
			file = file + (type == 1 ? extNameHz : extNameMx);
		}
		File f = new File(file);
		f.delete();
	}
	
	public List<ReportVO> listAllReport(boolean view, final int type) throws IOException, ClassNotFoundException{
		File f = new File(this.path + (view?"user/":""));
		File[] fs = f.listFiles(new FileFilter(){
			public boolean accept(File f){
                return !f.isDirectory() && f.getName().toLowerCase().endsWith(type == 1 ? extNameHz : extNameMx);
            }
		});
		List<ReportVO> ls = new ArrayList<ReportVO>();
		if(fs != null){
			for(int i=0; i<fs.length; i++){
				ReportVO vo = this.readReport(fs[i].getName(), view, type);
				ls.add(vo);
			}
		}
		return ls;
	}
	
	/**
	 * 返回所有报表列表， auth表示是否鉴权
	 * @param view
	 * @param userId
	 * @param auth 
	 * @param type 1 表示查询汇总， 2表示查询明细 
	 * @return
	 * @throws IOException
	 * @throws ClassNotFoundException
	 */
	public List<ReportVO> listReport(boolean view, String userId, boolean auth, final int type) throws IOException, ClassNotFoundException{
		File f = new File(this.path + (view?"user/":""));
		File[] fs = f.listFiles(new FileFilter(){
			public boolean accept(File f){
                return !f.isDirectory() && f.getName().toLowerCase().endsWith(type == 1 ? extNameHz : extNameMx);
            }
		});
		List<ReportVO> ls = new ArrayList<ReportVO>();
		if(fs != null){
			for(int i=0; i<fs.length; i++){
				ReportVO vo = this.readReport(fs[i].getName(), view, type);
				if(auth == false || (auth && vo.getUserid().equals(userId))){
					ls.add(vo);
				}
			}
		}
		return ls;
	}
	
	/**
	 * 获取共享的报表列表
	 * 共享报表存在于管理员报表中
	 * @return
	 * @throws IOException
	 * @throws ClassNotFoundException
	 */
	public List<ReportVO> listShareReport(final int type) throws IOException, ClassNotFoundException{
		File f = new File(this.path);
		File[] fs = f.listFiles(new FileFilter(){
			public boolean accept(File f){
                return !f.isDirectory() && f.getName().toLowerCase().endsWith(type == 1 ? extNameHz : extNameMx);
            }
		});
		List<ReportVO> ls = new ArrayList<ReportVO>();
		if(fs != null){
			for(int i=0; i<fs.length; i++){
				ReportVO vo = this.readReport(fs[i].getName(), false, type);
				if("y".equalsIgnoreCase(vo.getShare())){
					ls.add(vo);
				}
			}
		}
		return ls;
	}
	
	/**
	 * auth 表示获取立方体是否鉴权
	 * @param ls
	 * @param auth
	 * @return
	 */
	public List listCubes(List<ReportVO> ls, boolean auth){
		List cubeIds = VDOPUtils.getLoginedUser().getCubeIds();
		List ret = new ArrayList();
		for(ReportVO vo : ls){
			String ctx = vo.getPageInfo();
			JSONObject json = JSONObject.fromObject(ctx);
			Object cubesObjs = json.get("cube");
			if(cubesObjs == null){
				continue;
			}
			JSONArray cubes = (JSONArray)cubesObjs;
			if(cubes.size() == 0){
				continue;
			}
			for(int i=0; i<cubes.size(); i++){
				JSONObject cube = cubes.getJSONObject(i);
				String id= cube.getString("id");
				String name = cube.getString("name");
				String note = cube.getString("note");
				if((auth == false || auth && cubeIds.contains(id))){
					Map dt = new HashMap();
					dt.put("fileName", vo.getPageName());
					dt.put("fileId", vo.getPageId());
					dt.put("cubeId", id);
					dt.put("cubeName", name);
					dt.put("note", note);
					ret.add(dt);
				}
			}
		}
		return ret;
	}
	
	/**
	 * 返回立方体的信息，立方体所属数据集， 数据集所属数据源等信息
	 * @param fileId
	 * @param cubeId
	 * @return
	 * @throws ClassNotFoundException 
	 * @throws IOException 
	 */
	public JSONObject getCubeInfo(String fileId, String cubeId, int type) throws IOException, ClassNotFoundException{
		ReportVO rvo = this.readReport(fileId, false, type);
		String pageInfo  = rvo.getPageInfo();
		JSONObject json = JSONObject.fromObject(pageInfo);
		JSONObject cube = this.findCubeById(cubeId, json);
		JSONObject dataset = this.findDataSetById(cube.getString("datasetid"), json);
		JSONObject dsource = this.findDataSourceById(dataset.getString("dsid"), json);
		
		JSONObject ret = new JSONObject();
		ret.put("cube", cube);
		ret.put("dataset", dataset);
		ret.put("dsource", dsource);
		return ret;
	}
	
	public JSONObject findDataSourceById(String id, JSONObject json){
		JSONObject ret = null;
		JSONArray dsets = json.getJSONArray("datasource");
		for(int i=0; i<dsets.size(); i++){
			JSONObject dset = dsets.getJSONObject(i);
			if(dset.getString("dsid").equals(id)){
				ret = dset;
				break;
			}
		}
		return ret;
	}
	
	public JSONObject findDataSetById(String id, JSONObject json){
		JSONObject ret = null;
		JSONArray dsets = json.getJSONArray("dataset");
		for(int i=0; i<dsets.size(); i++){
			JSONObject dset = dsets.getJSONObject(i);
			if(dset.getString("datasetid").equals(id)){
				ret = dset;
				break;
			}
		}
		return ret;
	}
	
	public JSONObject findCubeById(String id, JSONObject json){
		JSONObject ret = null;
		JSONArray dsets = json.getJSONArray("cube");
		for(int i=0; i<dsets.size(); i++){
			JSONObject dset = dsets.getJSONObject(i);
			if(dset.getString("id").equals(id)){
				ret = dset;
				break;
			}
		}
		return ret;
	} 
	
	public ReportVO readReport(String name, boolean view, int type) throws IOException, ClassNotFoundException{
		String file = path + (view?"user/":"") + name ;
		if(!name.endsWith(type == 1 ? extNameHz : extNameMx)){
			file = file + (type == 1 ? extNameHz : extNameMx);
		}
		//文件不存在，返回null
		if(!new File(file).exists()){
			return null;
		}
		FileInputStream fis = new FileInputStream(file);
		ObjectInputStream  ois = new ObjectInputStream(fis);
		ReportVO nvo = (ReportVO)ois.readObject();
		ois.close();
		fis.close();
		return nvo;
	}
	
	/**
	 * 一般用户通过 share 获取报表
	 * @param name
	 * @return
	 * @throws IOException 
	 * @throws FileNotFoundException 
	 * @throws ClassNotFoundException 
	 */
	public ReportVO readShareReport(String name, int type) throws FileNotFoundException, IOException, ClassNotFoundException{
		String file = path + name ;
		if(!name.endsWith(type == 1 ? extNameHz : extNameMx)){
			file = file + (type == 1 ? extNameHz : extNameMx);
		}
		//文件不存在，返回null
		if(!new File(file).exists()){
			return null;
		}
		FileInputStream fis = new FileInputStream(file);
		ObjectInputStream  ois = new ObjectInputStream(fis);
		ReportVO nvo = (ReportVO)ois.readObject();
		ois.close();
		return nvo;
	}
	
	public int insertReport(ReportVO vo, boolean view, int type) throws IOException{
		String name = vo.getPageId();
		String file = path + (view?"user/":"") + name;
		if(!name.endsWith(type == 1 ? extNameHz : extNameMx)){
			file = file + (type == 1 ? extNameHz : extNameMx);
		}
		FileOutputStream fos = new FileOutputStream(file);
		ObjectOutputStream oout = new ObjectOutputStream(fos);
		oout.writeObject(vo);
		oout.close();
		fos.close();
		return 0;
	}
	
	public int updateReport(ReportVO vo, boolean view, int type) throws IOException, ClassNotFoundException{
		String name = vo.getPageId();
		String file = path + (view?"user/":"") + name;
		if(!name.endsWith(type == 1 ? extNameHz : extNameMx)){
			file = file + (type == 1 ? extNameHz : extNameMx);
		}
		File f = new File(file);
		if(!f.exists()){
			return 1;
		}
		FileInputStream fis = new FileInputStream(file);
		ObjectInputStream  ois = new ObjectInputStream(fis);
		ReportVO nvo = (ReportVO)ois.readObject();
		ois.close();
		fis.close();
		if(vo.getPageInfo() != null){
			nvo.setPageInfo(vo.getPageInfo());
		}
		if(vo.getPageName() != null){
			nvo.setPageName(vo.getPageName());
		}
		if(vo.getUpdatedate() != null){
			nvo.setUpdatedate(vo.getUpdatedate());
		}
		if(vo.getShare() != null){
			nvo.setShare(vo.getShare());
		}
		return insertReport(nvo, view, type);
	}
}
