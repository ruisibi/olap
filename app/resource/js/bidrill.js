if($ == undefined){
	$ = jQuery;
}
function drill(dimId, compId, pos, val, vdesc, oldDimId, islink){
	var comp = findCompById(compId);
	var dims = null;
	if(!comp.dims){
		comp.dims = copyCubedims(comp.tid);
	}
	if(pos == 'row'){
		dims = comp.tableJson.rows;
	}else{
		dims = comp.tableJson.cols;
	}
	//判断是否有联动
	if(comp.complink && islink){
		//联动图形
		var chartComp = findCompById(comp.complink);
		if(chartComp != null && isSameDimsInDrill(comp, chartComp)){
			drillingChart(dimId, chartComp,  pos, val, vdesc, oldDimId, false); //存在相同维度才能联动
		}
	}
	
	//设置当前维度值为过滤条件
	for(i=0; i<dims.length;i++){
		if(dims[i].id == oldDimId){
			dims[i].vals = val;
			/**
			if(dims[i].type == 'month'){
				dims[i].filtertype = 1; //按区间筛选
				dims[i].startmt = val;
				dims[i].endmt = val;
				delete dims[i].vals;
			}
			if(dims[i].type == 'day'){
				dims[i].filtertype = 1; //按区间筛选
				dims[i].startdt = val.substring(0, 4) + "-" + val.substring(4, 6) + "-" + val.substring(6, 8);
				dims[i].enddt = dims[i].startdt;
				delete dims[i].vals;
			}
			**/
		}
	}
	var json = null;
	for(j=0;j<comp.dims.length; j++){
		if(comp.dims[j].dim_id == dimId){
			json = comp.dims[j];
			break;
		}
	}
	dims.push({"id":json.dim_id, "dimdesc" : json.dim_desc, "type":json.dim_type, "colname":json.col_name,"tid":json.tid,"iscas":'', "tableName":(json.dim_tname == null ? "" : json.dim_tname), "tname":json.tname, "tableColKey":(json.tableColKey == null ? "" : json.tableColKey),"tableColName":(json.tableColName == null ? "" : json.tableColName), "dimord":json.dim_ord, "dim_name":json.dim_name, "iscas":(json.iscas == null ? "" : json.iscas), "grouptype":json.grouptype, "valType":json.valType, "dyna":json.dyna,"ord":json.ord,dateformat:json.dateformat});
	curTmpInfo.isupdate = true;
	tableView(comp, comp.id);
}
function drillDim(compId, ts, pos, val, vdesc, oldDimId){
	//查询指标已有维
	var comp = findCompById(compId);
	var offset = $(ts).offset();
	var opts = function(resp){
		$("#drillmenu").menu("destroy");
		var str = "<div id=\"drillmenu\" style=\"width:150px\">";
		var cnt = 0;
		var ignoreGroup = []; 
		var groupExist = function(ignoreGroup, group){
			var r = false;
			for(k=0; k<ignoreGroup.length; k++){
				if(ignoreGroup[k] == group){
					r = true;
				}
			}
			return r;
		};
		var findGroupChild = function(grouptype){
			var dimret = [];
			for(j=0; j<resp.length; j++){
				if(resp[j].grouptype == grouptype){
					dimret.push(resp[j]);
				}
			}
			return dimret;
		};
		for(i=0; i<resp.length; i++){
			//忽略用户已经选择的维度
			if(!dimExist(resp[i].dim_id, comp.tableJson.cols) && !dimExist(resp[i].dim_id, comp.tableJson.rows)){
				if(resp[i].grouptype == ''){ //无分组的，直接显示维度
					var dim_id  = resp[i].dim_id;
					str = str +  "<div onclick=\"drill("+dim_id+", "+comp.id+", '"+pos+"', '"+val+"', '"+vdesc+"', '"+oldDimId+"', true)\"><span style=\"color:#ccc\">下钻</span>" + resp[i].dim_desc+"</div>"
					cnt = cnt + 1;	
				}else{ //有分组，显示分组, 对于分组，如果下级分组已选择，不能再选择上级分组
					if(!groupExist(ignoreGroup, resp[i].grouptype)){
						var groups = "<div><span style=\"color:#ccc\">下钻</span><span>" + resp[i].groupname+"</span><div style=\"width:150px;\">"
						ignoreGroup.push(resp[i].grouptype);
						//查询分组的内容
						var lsdim = findGroupChild(resp[i].grouptype);
						var ss = "";
						var ccnt = 0;
						for(kl = 0; kl<lsdim.length; kl++){
							var tmp = lsdim[kl];
							var bcz = !dimExist(tmp.dim_id, comp.tableJson.cols) && !dimExist(tmp.dim_id, comp.tableJson.rows);
							if(bcz){
								ss = ss +  "<div onclick=\"drill("+tmp.dim_id+", "+comp.id+", '"+pos+"', '"+val+"', '"+vdesc+"', '"+oldDimId+"', true)\"><span style=\"color:#ccc\">下钻</span>" + tmp.dim_desc+"</div>"
								ccnt = ccnt + 1;	
							}else{
								ss = "";
								ccnt = 0;
							}
						}
						groups = groups + ss + "</div></div>";
						if(ccnt == 0){
							groups = "";
						}
						str = str + groups;
						cnt = cnt + ccnt;
					}
				}
			}
		}
		str = str + "</div>";
		//alert(str);
		if(cnt == 0){
			msginfo("数据已钻透。");
			return;
		}
		$(str).appendTo("body");
		$("#drillmenu").menu({});
		$("#drillmenu").menu("show", {left:offset.left, top:offset.top + 20});
		
	}
	if(comp.dims){
		opts(comp.dims);
	}else{
		var dt = comp.dims = copyCubedims(comp.tid);
		opts(dt);
	}
}
function copyCubedims(cubeId){
	//取得CUBE
	var cube = fundCubeById(cubeId);
	var resp = cube.dim;
	var dt = [];
	var ac = cube.aggreTable || cube.divison ? true : false;
	var idx = 0;
	for(i=0; i<resp.length; i++){
		var d = resp[i];
		if(d.tp == 'dim'){
			dt.push({dim_id:d.id,tid:cube.id,dim_name:d.col,dim_desc:d.name,dim_tname:d.codetable,dim_type:'frd',col_name:(ac?d.refId:d.col),iscas:'n',tname:(d.tname),tableName:d.codetable,tableColKey:d.keycol,tableColName:d.valcol,dim_ord:null,grouptype:"",groupname:'',valType:d.vtype,dyna:d.dyna,ord:idx,dateformat:d.dateformat});
			idx++;
		}else if(d.tp == 'group'){
			for(j=0; j<d.children.length; j++){
				var tt = d.children[j];
				dt.push({dim_id:tt.id,tid:cube.id,dim_name:tt.col,dim_desc:tt.name,dim_tname:tt.codetable,dim_type:(!tt.dimtype||tt.dimtype==''?"frd":tt.dimtype),col_name:(ac?tt.refId:tt.col),iscas:(j==0?'n':'y'),tname:(tt.tname),tableName:tt.codetable,tableColKey:tt.keycol,tableColName:tt.valcol,dim_ord:null,grouptype:'g'+d.id,groupname:d.name,valType:tt.vtype,dyna:tt.dyna,ord:idx,dateformat:tt.dateformat});
				idx++;
			}
		}
	}
	return dt;
}
//上卷维度
function goupDim(compId, ts, pos, dimId,islink){
	var dims = null;
	var comp = findCompById(compId);
	if(pos == 'row'){
		dims = comp.tableJson.rows;
	}else{
		dims = comp.tableJson.cols;
	}
	//判断是否有组件联动
	if(comp.complink && islink){
		var chartComp = findCompById(comp.complink);
		if(chartComp != null && isSameDimsInDrill(comp, chartComp)){ //必须维度相同才能联动。
			chartGoupDim(chartComp.id, dimId, pos, false);
		}
	}
	//清除过滤条件
	//删除该维度以后的维度
	var idx = 0;
	for(i=0; i<dims.length;i++){
		if(dims[i].id == dimId){
			dims[i].vals = "";
			if(dims[i].type == 'day'){
				delete dims[i].startdt;
				delete dims[i].enddt;
			}
			if(dims[i].type == 'month'){
				delete dims[i].startmt;
				delete dims[i].endmt;
			}
			idx = i;
			break;
		}
	}
	dims.splice(idx + 1, dims.length - 1);
	curTmpInfo.isupdate = true;
	tableView(comp, comp.id);
}
//图形钻取
function drillChart(xvalue, xvalueDesc,yvalue, svalue, pos, compId, oldDimId){
	//查询指标已有维
	var comp = findCompById(compId);
	var offset = pos;
	var opts = function(resp){
		$("#drillmenu").menu("destroy");
		var str = "<div id=\"drillmenu\" style=\"width:150px\">";
		var cnt = 0;
		var ignoreGroup = []; 
		var groupExist = function(ignoreGroup, group){
			var r = false;
			for(k=0; k<ignoreGroup.length; k++){
				if(ignoreGroup[k] == group){
					r = true;
				}
			}
			return r;
		};
		var findGroupChild = function(grouptype){
			var dimret = [];
			for(j=0; j<resp.length; j++){
				if(resp[j].grouptype == grouptype){
					dimret.push(resp[j]);
				}
			}
			return dimret;
		};
		for(i=0; i<resp.length; i++){
			//忽略用户已经选择的维度
			if(dimExist(resp[i].dim_id, comp.chartJson.params) ||  (comp.chartJson.xcol && resp[i].dim_id == comp.chartJson.xcol.id) || (comp.chartJson.scol && resp[i].dim_id == comp.chartJson.scol.id)){
				continue;
			}
			
			if(resp[i].grouptype == ''){ //无分组的，直接显示维度
				var dim_id  = resp[i].dim_id;
				str = str +  "<div onclick=\"drillingChart("+dim_id+", "+comp.id+", 'row', '"+xvalue+"', '"+xvalueDesc+"', '"+oldDimId+"', true)\"><span style=\"color:#ccc\">下钻</span>" + resp[i].dim_desc+"</div>"
				cnt = cnt + 1;	
			}else{ //有分组，显示分组, 对于分组，如果下级分组已选择，不能再选择上级分组
				if(!groupExist(ignoreGroup, resp[i].grouptype)){
					var groups = "<div><span style=\"color:#ccc\">下钻</span><span>" + resp[i].groupname+"</span><div style=\"width:150px;\">"
					ignoreGroup.push(resp[i].grouptype);
					//查询分组的内容
					var lsdim = findGroupChild(resp[i].grouptype);
					var ss = "";
					var ccnt = 0;
					for(kl = 0; kl<lsdim.length; kl++){
						var tmp = lsdim[kl];
						var cz = dimExist(tmp.dim_id, comp.chartJson.params) ||  (comp.chartJson.xcol && tmp.dim_id == comp.chartJson.xcol.id) || (comp.chartJson.scol && tmp.dim_id == comp.chartJson.scol.id);
						if(!cz){
							ss = ss +  "<div onclick=\"drillingChart("+tmp.dim_id+", "+comp.id+", 'row', '"+xvalue+"', '"+xvalueDesc+"', '"+oldDimId+"', true)\"><span style=\"color:#ccc\">下钻</span>" + tmp.dim_desc+"</div>"
							ccnt = ccnt + 1;	
						}else{
							ss = "";
							ccnt = 0;
						}
					}
					groups = groups + ss + "</div></div>";
					if(ccnt == 0){
						groups = "";
					}
					str = str + groups;
					cnt = cnt + ccnt;
				}
			}
			
		}
		str = str + "</div>";
		if(cnt == 0){
			msginfo("数据已钻透。");
			return;
		}
		$(str).appendTo("body");
		$("#drillmenu").menu({});
		$("#drillmenu").menu("show", {left:offset.left, top:offset.top + 20});
	}
	if(comp.dims){
		opts(comp.dims);
	}else{
		var dt = comp.dims = copyCubedims(comp.tid);
		opts(dt);
	}
}
//开始钻取图形
function drillingChart(id, compId, pos, xvalue, xvalueDesc, oldDimId, islink){
	var comp = findCompById(compId);
	if(!comp.dims){
		comp.dims = copyCubedims(comp.tid);
	}
	//设置当前维度值为过滤条件
	if(pos == "row"){
		comp.chartJson.xcol.vals = xvalue + "";
		comp.chartJson.xcol.valDesc = xvalueDesc;
		comp.chartJson.xcol.pos = "row";
	}else{
		comp.chartJson.scol.vals = xvalue + "";
		comp.chartJson.scol.valDesc = xvalueDesc;
		comp.chartJson.scol.pos = "col";
	}
	
	//判断是否联动表格
	if(comp.complink && islink){
		var tableComp = findCompById(comp.complink);
		if(tableComp != null && isSameDimsInDrill(tableComp, comp)){ //必须维度相同才能联动。
			drill(id, tableComp, 'row', xvalue, xvalueDesc, oldDimId, false);
		}
	}
	
	var dim = pos == "row" ? comp.chartJson.xcol : comp.chartJson.scol;
	dim.filtertype = 2; // 按值钻取
	if(dim.type == 'month'){
		delete dim.startmt;
		delete dim.endmt;
	}
	if(dim.type == 'day'){
		delete dim.startdt;
		delete dim.enddt;
	}
	//把当前维放入params
	//如果当前维度是合计，不用加入
	if(xvalue == '合计' && xvalueDesc == '合计'){
	}else{
		comp.chartJson.params.push(pos=="row"?comp.chartJson.xcol:comp.chartJson.scol);
	}
	//更新x轴
	var json = null;
	for(j=0;j<comp.dims.length; j++){
		if(comp.dims[j].dim_id == id){
			json = comp.dims[j];
			break;
		}
	}
	var nxcol = {"id":json.dim_id, "dimdesc" : json.dim_desc, "type":json.dim_type, "colname":json.col_name,"tid":json.tid,"iscas":'', "tableName":(json.dim_tname == null ? "" : json.dim_tname),"tname":json.tname,  "tableColKey":(json.tableColKey == null ? "" : json.tableColKey),"tableColName":(json.tableColName == null ? "" : json.tableColName), "dimord":json.dim_ord, "dim_name":json.dim_name, "iscas":(json.iscas == null ? "" : json.iscas),"grouptype":json.grouptype,"valType":json.valType,"dyna":json.dyna,"ord":json.ord,"dateformat":json.dateformat};
	if(pos == "row"){
		comp.chartJson.xcol = nxcol;
	}else{
		comp.chartJson.scol = nxcol;
	}
	//回写X轴的值
	var node = nxcol;
	$("#T" + comp.id +  (pos=="row"?" #xcol":" #scol")).html("<span class=\"charttxt\">" + node.dimdesc + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.id+","+(pos=="row"?"'xcol'":"'scol'")+", '"+node.dimdesc+"')\"></span>");
	curTmpInfo.isupdate = true;
	chartview(comp, comp.id);
}
//图形上卷
function chartGoupDim(compId,dimId, pos, islink){
	var comp = findCompById(compId);
	var dims = comp.chartJson.params;
	//判断是否有组件联动
	if(comp.complink && islink){
		var tableComp = findCompById(comp.complink);
		if(tableComp != null && isSameDimsInDrill(tableComp, comp)){ //必须维度相同才能联动。
			goupDim(tableComp.id, null, pos, dimId, false);
		}
	}
	//清除过滤条件
	//删除该维度以后的维度
	var idx = 0;
	var xcol = null;
	for(i=0; i<dims.length;i++){
		if(dims[i].id == dimId){
			dims[i].vals = "";
			dims[i].valDesc = "";
			delete dims[i].filtertype;
			idx = i;
			xcol = dims[i];
			break;
		}
	}
	if(pos == "row"){
		comp.chartJson.xcol = xcol;
	}else{
		comp.chartJson.scol = xcol;
	}
	dims.splice(idx, dims.length);
	
	//回写X轴的值
	var node = xcol;
	$("#T" + comp.id + (pos=="row"?" #xcol":" #scol")).html("<span class=\"charttxt\">" + node.dimdesc + "</span><span class=\"charticon\" title=\"配置\" onclick=\"chartmenu(this, "+node.id+","+(pos=="row"?"'xcol'":"'scol'")+", '"+node.dimdesc+"')\"></span>");
	
	curTmpInfo.isupdate = true;
	chartview(comp, comp.id);
}
/**
判断图形和表格是否有相同的维度，如果维度不同，不能联动
**/
function isSameDimsInDrill(table, chart){
	var tj = table.tableJson;
	var cj = chart.chartJson;
	var tcnt = tj.cols.length + tj.rows.length;
	var ccnt = (cj.params?cj.params.length:0) + ($.isEmptyObject(cj.xcol)?0:1) + ($.isEmptyObject(cj.scol)?0:1);
	if(tcnt != ccnt){
		return false;
	}
	var ret = true;
	for(i=0; cj.params && i<cj.params.length; i++){
		if(!dimExist(cj.params[i].id, tj.cols) && !dimExist(cj.params[i].id, tj.rows)){
			return false;
		}
	}
	if(!$.isEmptyObject(cj.xcol)){
		if(!dimExist(cj.xcol.id, tj.cols) && !dimExist(cj.xcol.id, tj.rows)){
			return false;
		}
	}
	if(!$.isEmptyObject(cj.scol)){
		if(!dimExist(cj.scol.id, tj.cols) && !dimExist(cj.scol.id, tj.rows)){
			return false;
		}
	}
	return ret;
}
/**
判断是否有时间参数，如果有，必须表格组件中也具有相同的参数
**/
function paramsamedimdate(comp){
	var same = true;
	var exist = function(input){
		var ret = false;
		for(var i=0; comp.tableJson&&i<comp.tableJson.cols.length; i++){
			if(comp.tableJson.cols[i].type == input){
				ret = true;
				break;
			}
		}
		for(var i=0; comp.tableJson&&i<comp.tableJson.rows.length; i++){
			if(comp.tableJson.rows[i].type == input){
				ret = true;
				break;
			}
		}
		return ret;
	}
	var params = pageInfo.params;
	for(i=0; params&&i<params.length; i++){
		if(params[i].grouptype == 'date'){
			if(!exist(params[i].type)){
				same = false;
				break;
			}
		}
	}
	return same;
}
//删除衍生指标
function delExtKpi(ts, kpiId, compute){
	var compId = $(ts).parents(".comp_table").attr("id").replace("T", "");
	var comp = findCompById(Number(compId));
	//设置指标排序的标识
	var kpi = findKpiById(kpiId, comp.kpiJson);
	var js = kpi.compute.split(",");
	if(js.length == 1){
		delete kpi.compute;
	}else{
		//剔除需要删除的计算指标
		var ret = "";
		for(i=0; i<js.length; i++){
			if(js[i] != compute){
				ret = ret + js[i] + ",";
			}
		}
		kpi.compute = ret.substring(0, ret.length  - 1);
	}
	tableView(comp, compId);
}