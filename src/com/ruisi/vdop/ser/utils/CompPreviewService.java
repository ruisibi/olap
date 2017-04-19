package com.ruisi.vdop.ser.utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.sql.SQLException;
import java.util.Map;

import javax.script.Compilable;
import javax.script.CompiledScript;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import javax.servlet.ServletContext;

import org.apache.commons.fileupload.FileUploadException;

import com.ruisi.ext.engine.ConstantsEngine;
import com.ruisi.ext.engine.ExtConfigConstants;
import com.ruisi.ext.engine.ExtConstants;
import com.ruisi.ext.engine.control.InputOption;
import com.ruisi.ext.engine.control.InputOptionFactory;
import com.ruisi.ext.engine.cross.CrossFieldLoader;
import com.ruisi.ext.engine.dao.DaoHelper;
import com.ruisi.ext.engine.init.ExtEnvirContext;
import com.ruisi.ext.engine.init.ExtEnvirContextImpl;
import com.ruisi.ext.engine.service.loginuser.LoginUserFactory;
import com.ruisi.ext.engine.service.loginuser.LoginUserInfoLoader;
import com.ruisi.ext.engine.service.loginuser.LoginUserInfoLoaderImpl;
import com.ruisi.ext.engine.util.DaoUtils;
import com.ruisi.ext.engine.util.IdCreater;
import com.ruisi.ext.engine.view.builder.BuilderManager;
import com.ruisi.ext.engine.view.context.Element;
import com.ruisi.ext.engine.view.context.ExtContext;
import com.ruisi.ext.engine.view.context.MVContext;
import com.ruisi.ext.engine.view.context.form.InputField;
import com.ruisi.ext.engine.view.emitter.ContextEmitter;
import com.ruisi.ext.engine.view.emitter.html.HTMLEmitter;
import com.ruisi.ext.engine.view.exception.ExtConfigException;
import com.ruisi.ext.engine.view.exception.ExtRuntimeException;
import com.ruisi.ext.engine.wrapper.ByteArrayWriterImpl;
import com.ruisi.ext.engine.wrapper.ExtRequest;
import com.ruisi.ext.engine.wrapper.ExtRequestImpl;
import com.ruisi.ext.engine.wrapper.ExtResponse;
import com.ruisi.ext.engine.wrapper.ExtResponseImpl;
import com.ruisi.ext.engine.wrapper.ExtWriter;
import com.ruisi.vdop.ser.ruisibi.TableService;
import com.ruisi.vdop.util.VDOPUtils;

/**
 * 组件预览类.创建必要的组件预览对象
 * @author hq
 * @date Aug 18, 2010
 */
public class CompPreviewService {
	
	private ExtRequest request;
	private ExtResponse response;
	private ServletContext context;
	private DaoHelper dao;
	public DaoHelper getDao() {
		return dao;
	}

	private ExtEnvirContext envirCtx;
	public ExtEnvirContext getEnvirCtx() {
		return envirCtx;
	}

	Map<String, InputField> params = null; //请求的参数
	
	public Map<String, InputField> getParams() {
		return params;
	}

	public void setParams(Map<String, InputField> params) {
		this.params = params;
	}

	public CompPreviewService() throws IOException{
		request = new ExtRequestImpl(VDOPUtils.getRequest());
		response = new ExtResponseImpl(VDOPUtils.getResponse());
		context = VDOPUtils.getServletContext();
		//dao = DaoUtils.getDaoHelper(context);
		//out = new ExtWriterImpl(response.getWriter());
	}
	
	public void initPreview() throws FileUploadException{
		
		LoginUserFactory loginUserFactory = LoginUserFactory.getInstance();
		LoginUserInfoLoader loginUserInfoLoader = new ExtLoginInfoLoader();
		loginUserFactory.createLoginUser(request, response, dao, loginUserInfoLoader);
		
		//servletContext放入request, 显示图形时需要调用
		InputOption option = InputOptionFactory.createInputOption(request, response, params);
		request.setAttribute(ExtConstants.optionIdKey, option);
		ExtEnvirContext ec = new ExtEnvirContextImpl(option);
		this.envirCtx = ec;
		//request.setAttribute(ExtConstants.contextSessionKey, ec);
		
		//请求为post,设置fromId
		request.setAttribute(ExtConstants.fromIdKey, TableService.deftMvId);
		
		//创建crossReport需要用到的loader
		CrossFieldLoader loader = null;
		String fieldLoader = ExtContext.getInstance().getConstant("fieldLoader");
		if(fieldLoader == null){
			throw new ExtRuntimeException("未配置 fieldLoader.");
		}
		try {
			loader = (CrossFieldLoader)Class.forName(fieldLoader).newInstance();
			loader.setRequest(this.request);
		} catch (Exception e) {
			String err = ConstantsEngine.replace(ExtConfigConstants.crossColNotExist, fieldLoader);
			throw new ExtRuntimeException(err);
		}
		request.setAttribute(ExtConstants.fieldLoader, loader);
	}
	
	public String buildMV(Element mv) throws Exception{
		ContextEmitter emitter = new HTMLEmitter();
		return buildMV(mv, emitter);
	}
	
	public String buildMV(Element mv, ContextEmitter emitter) throws Exception{
		//把MV放入内存对象
		if(mv instanceof MVContext){
			String formId = ExtConstants.formIdPrefix + IdCreater.create();
			MVContext mvo = (MVContext)mv;
			mvo.setFormId(formId);
			if(!ExtContext.getInstance().chkMvExist(mvo.getMvid())){
				ExtContext.getInstance().putMVContext(mvo);
			}
		}
		Map<String, InputField> params =  this.params;
		InputOption option = InputOptionFactory.createInputOption(request, response, params);
		String ret = BuilderManager.buildContext2String(mv, request, this.envirCtx,  response, dao, emitter, option, VDOPUtils.getServletContext());
		return ret;
	}
	
	/**
	 * 预先编译js运算公式
	 * @throws ScriptException 
	 */
	public void initJSFunc(String scripts) throws ScriptException{
		ScriptEngineManager factory = new ScriptEngineManager();
		ScriptEngine engine = factory.getEngineByName("JavaScript");

		//把一些常用的对象放入其中
		//engine.put("out", out);
		engine.put("request", this.request);
		Compilable compilable = (Compilable) engine;
		CompiledScript compiled = compilable.compile(scripts);
		compiled.eval();
		
		//把engine放入request,方便调用
		request.setAttribute(ExtConstants.scriptEngineKey, engine);
	}

	public ExtRequest getRequest() {
		return request;
	}

	public ExtResponse getResponse() {
		return response;
	}

	public ServletContext getContext() {
		return context;
	}
}
