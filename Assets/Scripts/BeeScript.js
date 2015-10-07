#pragma strict

class Inventory
{
	var m_Img : Texture2D = null;
	var m_Item : GameObject = null;	 
}
var m_Camera:GameObject = null;
var m_Color:Color = Color.yellow;
var m_Team:int = 0;
var m_Meshes:GameObject[] = null;
var m_SwarmInstance : GameObject = null;
var m_WorkerBeeInstance : GameObject = null;
var m_DeathEffect : GameObject = null;
var m_BurningEffect : GameObject = null;
var m_HitEffect : GameObject = null;
var m_DazeEffect : GameObject = null;
//var m_HoneycombCount : int = 0; //how many honey comb items have we collected? when this number reaches 3 the honey comb item will spawn a hive for us

var m_CashInSound:AudioClip;

var m_GroundPosition:Vector3;
var m_GroundPositionVel:Vector3;
var m_Bounce : boolean = true;
var m_CanTeleport : boolean = false;
var m_HP : int = 3;
var m_ShieldHP : int = 10;
var m_WorkerBees:int = 3;
var m_MaxWorkerBees:int = 3;
var m_Money : int = 0;
var m_PollenCount:int = 0;
var m_Honey:float = 0;
var m_HoneyInterpolator:float = 0;
var m_HurtSound:AudioClip = null;
var m_DeathSound:AudioClip = null;

var m_CurrXP : int = 0;
var m_CurrLevel : int = 0;
var m_NumUpgradesAvailable:int = 0; //does the bee have a level upgrade available?
var m_XPToLevel : float[];

var m_MatchPoints:int = 0;
var m_Kills:int = 0;
var m_Deaths:int = 0;
var m_LongestChain:int = 0;
 
var m_XPMeterFlashTimer:float = 0;
var m_XPMeterFade :float = 0;
var m_LifeMeterFlashTimer:float = 0;
var m_LifeMeterFade :float = 0;
var m_HitTargetFade : float = 0;
private var m_HitTargetEntity : GameObject = null; //the last entity we hit with a buller

// var m_CurrSwmXP : float = 0;
// var m_CurrSwmLevel : int = 0;
// var m_XPToSwmLevel : int[];

var HandIconTexture : Texture2D = null;
var XPText : GameObject = null;
var BarBGTexture : Texture2D = null;
var m_LifeTextureContainer : Texture2D = null;
var m_LifeTexture : Texture2D = null;
var MeterBarTexture : Texture2D = null;
var MeterBarBGTexture : Texture2D = null;
var CoinTexture : Texture2D = null;
var HiveBarTexture : Texture2D = null;
var HiveBarBGTexture : Texture2D = null;
var InventoryBoxTexture : Texture2D = null;
var ReloadBarTexture : Texture2D = null;
var AmmoIconTexture : Texture2D = null;
var PollenMeterTexture : Texture2D = null;
var HoneypotTexture : Texture2D = null;
var HoneypotOutlineTexture : Texture2D = null;
var BeeTexture : Texture2D = null;
var BeeWingsTexture : Texture2D = null;
var ClockBGTexture : Texture2D = null;
var ClockHandTexture : Texture2D = null;
var HiveTexture:Texture2D = null;
var FlowerTexture:Texture2D = null;
var CaptureRingTexture:Texture2D = null;
var NodeLineTexture:Texture2D = null;
var m_AimTargetTexture : Texture2D = null;
var m_HitTargetTexture:Texture2D = null;

var m_FocusedGroupNum:int = -1;
var m_FocusedObject:GameObject = null;
var m_DraggedFocusObject:GameObject = null;
var FontStyle : GUIStyle = null;
var m_DrawGUI:boolean = true;
var SmallFontStyle : GUIStyle = null;


var m_Inventory : Inventory[];


var m_LevelUpSound:AudioClip = null;
var m_RespawnSound:AudioClip = null;
var m_ViewMap:boolean = false;


function Awake()
{
	m_Inventory = new Inventory[2];
	m_Inventory[0] = new Inventory();
	m_Inventory[1] = new Inventory();
}

function Start () {
	m_Money = 0;
	m_CurrXP = 0;

}

function GetCurrentLevel() : int
{
	for(var i = 0; i < m_XPToLevel.length; i++)
	{
		if(m_CurrXP < m_XPToLevel[i])
		{
			return i;
		}
	}
	return -1;
}

function SetColor(c:Color)
{
	var go:GameObject = GameObject.Find(gameObject.name+"/Bee/NewBee/NewBee");

	
	for(var mat:Material in go.renderer.materials)
	{
		if(mat.name.Contains("BeeSkin"))
		{
			mat.color = c;
			m_Color = c;
			return;
		}
	}
}

function FadeOutLifeMeter(time:float)
{
	//wait just a seconds before starting the fade
	if(m_LifeMeterFade > 0)
	{
		m_LifeMeterFade = time;
		return;
	}
	m_LifeMeterFade = time;
	var delta:float = 0.033;
	var m_OrigTime:float = time;
	//m_LifeMeterFade = time/m_OrigTime;
	yield WaitForSeconds(1);
	while(m_LifeMeterFade > 0)
	{
		
		m_LifeMeterFade -= delta; 
		
		yield WaitForSeconds(delta);
	}
	m_LifeMeterFade = 0;
}

function FadeOutXPMeter(time:float)
{
	//wait just a seconds before starting the fade
	if(m_XPMeterFade > 0)
	{
		m_XPMeterFade = time;
		return;
	}
	m_XPMeterFade = time;
	var delta:float = 0.033;
	var m_OrigTime:float = time;
	//m_XPMeterFade = time/m_OrigTime;
	yield WaitForSeconds(1);
	while(m_XPMeterFade > 0)
	{
		
		m_XPMeterFade -= delta; 
		
		yield WaitForSeconds(delta);
	}
	m_XPMeterFade = 0;
}


function Update() {
	
	rigidbody.velocity = Vector3(0,0,0);
	var Terr:TerrainCollisionScript = GetComponent(TerrainCollisionScript);
	var coll= Terr.m_TerrainInfo.collider;
	
	if(!GetComponent(CharacterController).isGrounded)
	{	
		//Debug.Log("in air");
		GetComponent(UpdateScript).m_Accel.y = -300;
	}
	else
	{
		//Debug.Log("ground");
		//this may be an issue setting accel to zero
		//GetComponent(UpdateScript).m_Accel.y = 0;
		GetComponent(UpdateScript).m_Vel.y = 0;
		
	//	if(transform.up != Terr.m_TerrainInfo.normal)
		//	transform.up = Terr.m_TerrainInfo.normal;
	}
	if(Network.isServer)
	{	
	 
		

	}
	
	if(Input.GetKeyDown(KeyCode.LeftControl))
	{
		// m_ViewMap = !m_ViewMap;
		// if(m_ViewMap)
		// {
			// GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
			// GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			// Camera.main.GetComponent(CameraScript).m_CamVel = Vector3(0,0,0);
			
			// Camera.main.orthographicSize = 400;
			// Screen.showCursor = true;
			
			// Camera.main.transform.position.x = gameObject.transform.position.x;
			// Camera.main.transform.position.z = gameObject.transform.position.z;
		// }
		// else
		// {
			// Screen.showCursor = false;
		// }
	}
	
	// if(m_ViewMap)
	// {
		// Camera.main.transform.eulerAngles = Vector3(90,0,0);
		// Camera.main.orthographic = true;
		
		
		// GetComponent(BeeControllerScript).m_ControlEnabled = false;
		// GetComponent(BeeControllerScript).m_LookEnabled = false;
	// }
	// else
	// {
		// m_ViewMap = false;
		// Camera.main.GetComponent(Camera).orthographic = false;
	
		// //GetComponent(BeeControllerScript).m_ControlEnabled = true;
		// GetComponent(BeeControllerScript).m_LookEnabled = true;
	// }
	
	
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		GameEventMessenger.ProcessMesages();
	}
	
	if(m_ViewMap)
	{
		var speed = Camera.main.GetComponent(Camera).orthographicSize*5;
		Camera.main.GetComponent(CameraScript).m_CamDrag = speed*0.5;
		if(Input.GetAxis("Strafe Left/Right") < 0)
		{
			Debug.Log("yes");
			Camera.main.GetComponent(CameraScript).m_CamVel -= Vector3.right *speed* Time.deltaTime;
		}
		
		if(Input.GetAxis("Strafe Left/Right") > 0)
		{
			Camera.main.GetComponent(CameraScript).m_CamVel += Vector3.right * speed*Time.deltaTime;
		}
		
		if(Input.GetAxis("Use Item/Interact") > 0)
		{
			if(Input.GetAxis("Move Forward/Back") < 0)
			{
				Camera.main.GetComponent(CameraScript).m_CamVel.y += speed*Time.deltaTime;
			}
			
			if(Input.GetAxis("Move Forward/Back") > 0)
			{
				Camera.main.GetComponent(CameraScript).m_CamVel.y -= speed*Time.deltaTime;
				
			}
		}
		else
		{
			if(Input.GetAxis("Move Forward/Back") < 0)
			{
				Camera.main.GetComponent(CameraScript).m_CamVel -= Vector3.forward * speed*Time.deltaTime;
			}
			
			if(Input.GetAxis("Move Forward/Back") > 0)
			{
				Camera.main.GetComponent(CameraScript).m_CamVel += Vector3.forward * speed*Time.deltaTime;
				
			}
		}
		
		if(Camera.main.transform.position.z > gameObject.Find("map").renderer.bounds.max.z)
		{
			Camera.main.GetComponent(CameraScript).m_CamVel.z = 0;
			Camera.main.GetComponent(CameraScript).m_CamPos.z = gameObject.Find("map").renderer.bounds.max.z;
		}
		else
		if(Camera.main.transform.position.z < gameObject.Find("map").renderer.bounds.min.z)
		{
			Camera.main.GetComponent(CameraScript).m_CamVel.z = 0;
			Camera.main.GetComponent(CameraScript).m_CamPos.z = gameObject.Find("map").renderer.bounds.min.z;
		}
		
		if(Camera.main.transform.position.x > gameObject.Find("map").renderer.bounds.max.x)
		{
			Camera.main.GetComponent(CameraScript).m_CamVel.x = 0;
			Camera.main.GetComponent(CameraScript).m_CamPos.x = gameObject.Find("map").renderer.bounds.max.x;
		}
		else
		if(Camera.main.transform.position.x < gameObject.Find("map").renderer.bounds.min.x)
		{
			Camera.main.GetComponent(CameraScript).m_CamVel.x = 0;
			Camera.main.GetComponent(CameraScript).m_CamPos.x = gameObject.Find("map").renderer.bounds.min.x;
		}
		
		var extent = Mathf.Max(gameObject.Find("map").renderer.bounds.extents.x, gameObject.Find("map").renderer.bounds.extents.z);
		if(Camera.main.orthographicSize < extent*0.5)
		{
			Camera.main.GetComponent(CameraScript).m_CamVel.y = 0;
			Camera.main.orthographicSize = extent*0.5;
		}
		else
		if(Camera.main.orthographicSize > extent)
		{
			Debug.Log(extent*1.2);
			Camera.main.GetComponent(CameraScript).m_CamVel.y = 0;
			Camera.main.orthographicSize = extent;
		}
	}
}

function HitTargetFade(hit:GameObject)
{
	m_HitTargetEntity = hit;
	var timer:float = 0.5;
	m_HitTargetFade = 1;
	while (timer > 0)
	{
		m_HitTargetFade -= 0.066;
		timer -= 0.033;
		yield WaitForSeconds(0.033);
	}
	
}

function OnGUI()
{	
	//only draw our client info
	if(NetworkUtils.IsLocalGameObject(gameObject) && m_Camera.active)
	{
		if(m_Camera.camera.rect.width < 1)
		{
			FontStyle.fontSize = 24;
			SmallFontStyle.fontSize = 16;
		}
		
		if(m_DrawGUI)
			DrawGUI();
	}
}

public var lineCount: int = 100;
private var radius: float = 999.0f;
static var lineMaterial: Material;
static function CreateLineMaterial() {
	 if( !lineMaterial ) {
        lineMaterial = new Material( "Shader \"Lines/Colored Blended\" {" +
            "SubShader { Pass { " +
            "    Blend SrcAlpha OneMinusSrcAlpha " +
            "    ZWrite Off Cull Off Fog { Mode Off } " +
            "    BindChannels {" +
            "      Bind \"vertex\", vertex Bind \"color\", color }" +
            "} } }" );
        lineMaterial.hideFlags = HideFlags.HideAndDontSave;
        lineMaterial.shader.hideFlags = HideFlags.HideAndDontSave;
    }
}
// Will be called after all regular rendering is done
public function OnRenderObject() {

if(GetComponent(BeeControllerScript).m_AimTarget != null)
	return;
	CreateLineMaterial();
	// Apply the line material
	lineMaterial.SetPass(0);
	GL.PushMatrix();
	// match our transform
	GL.MultMatrix(transform.localToWorldMatrix);
	// Draw lines
	// GL.Begin(GL.TRIANGLES);
	// //for (var i: int = 0; i < lineCount; ++i) {
		// var a: float = lineCount;
		// //a =i / a;
		// var angle: float = 0.5*Mathf.Deg2Rad;//a * Mathf.PI * 2;
		// // Vertex colors change from red to green
		// GL.Color(new Color(1, 1, 1, 0.15F));
		// // One vertex at transform position
		// GL.Vertex3(0, 0, 10);
		 // //Another vertex at edge of circle
		// GL.Vertex3(Mathf.Sin(-angle) * radius, 4, Mathf.Cos(-angle) * radius);
		// GL.Vertex3(Mathf.Sin(angle) * radius, 4, Mathf.Cos(angle) * radius);
	// //}
	// GL.End();
	// GL.Begin(GL.LINES);
	// //for (var i: int = 0; i < lineCount; ++i) {
	
		// // Vertex colors change from red to green
		// GL.Color(new Color(1, 1, 1, 0.35F));
		// // One vertex at transform position
		// GL.Vertex3(0, 0, 10);
		// // Another vertex at edge of circle
		// GL.Vertex3(Mathf.Sin(-angle) * radius, 4, Mathf.Cos(-angle) * (radius+10));
		// GL.Vertex3(0, 0, 10);
		// GL.Vertex3(Mathf.Sin(angle) * radius, 4, Mathf.Cos(angle) * (radius+10));
		// //GL.Vertex3(0, 0, 0);
		// //GL.Vertex3(0, 0, radius);
	// //}
	// GL.End();
	GL.PopMatrix();
}


function DrawGUI()
{
	if(GetComponent(BeehiveGUI).m_bShow)
		return;
		
		
		var beeCtrlScript:BeeControllerScript = GetComponent(BeeControllerScript);
		
	
		
		//do camera location calculations
		var camWidth = m_Camera.camera.rect.width;
		var camScale = m_Camera.camera.rect.width;
		var camPos:Vector2 = Vector2(m_Camera.camera.rect.x*Screen.width,Mathf.Abs(m_Camera.camera.rect.y - 0.5)*Screen.height);
		
		if(m_Camera.camera.rect.y == 0.0 &&  m_Camera.camera.rect.height == 1)
			camPos.y = 0;
		var relPos:Vector2 = Vector2(camPos.x+83*camScale, camPos.y+16*camScale);
		

		var fPerc :float = 0;
		var maxHP:float = GetMaxHP();
		var width:float = 32*camScale;
	
		
		
		var bottom:float = camPos.y +m_Camera.camera.rect.height*Screen.height;
		var right:float = camPos.x + Screen.width* m_Camera.camera.rect.width;
		
		//draw the game event messages
		GameEventMessenger.DrawMessages(relPos.x-32,(bottom- 48),SmallFontStyle);
			
		//draw the honey pots for score
		GUI.BeginGroup(Rect(camPos.x + Screen.width* m_Camera.camera.rect.width*0.7,bottom-64* camScale, 512*camScale, 512*camScale));		
			for(var i:int = 0; i < 2; i++)
			{	
				var player:GameObject = NetworkUtils.GetGameObjectFromClient(i);
				if(player == null)
					continue;
				
				if(gameObject == NetworkUtils.GetGameObjectFromClient(0))
				{
					var honeyPerc :float = NetworkUtils.GetGameObjectFromClient(i).GetComponent(BeeScript).m_Honey;
					//var fD:float = GameStateManager.m_PointsToWin;
					//honeyPerc/= fD;
					//honeyPerc = Mathf.Min(honeyPerc, 1);
					
				
					GUI.color  = NetworkUtils.GetColor(player);
					GUI.DrawTexture(Rect(164*camScale*(i+1), 32*camScale, 96*camScale, 96*camScale), HoneypotTexture, ScaleMode.ScaleToFit, true);
					GUI.color = Color.white;
						GUI.DrawTexture(Rect(164*camScale*(i+1), 32*camScale, 96*camScale, 96*camScale), HoneypotOutlineTexture, ScaleMode.ScaleToFit, true);
					GUI.backgroundColor = Color.black;
					GUI.Label(Rect(164*camScale*i+96*camScale, 0, 128*camScale, 32*camScale),  (honeyPerc).ToString("F2")+"%",FontStyle);
				
				}
			}
		GUI.EndGroup();
		
		//draw other player labels
		GUI.BeginGroup(Rect(camPos.x ,camPos.y, Screen.width*camScale, Screen.height*camScale));	
			GUI.color = Color.red;
			for(i= 0; i < NetworkUtils.GetNumClients(); i++)
			{	
				player = NetworkUtils.GetGameObjectFromClient(i);
				
				if(player == null || player.GetComponent(BeeScript).m_Team == m_Team || player.GetComponent(RespawnDecorator) != null)
					continue;
				
				if(player != gameObject && Vector3.Dot((player.transform.position - transform.position).normalized, transform.forward) > 0.1)
				{
					if(!Physics.Raycast(transform.position,(player.transform.position - transform.position).normalized, (player.transform.position - transform.position).magnitude,GetComponent(TerrainCollisionScript).m_TerrainLayer))
					{
						var pt:Vector3 = m_Camera.camera.WorldToScreenPoint(player.transform.position+Vector3.up *30);
						pt.y = Screen.height - pt.y - camPos.y;
						pt.x = pt.x - camPos.x;
						var rt:Rect = GUILayoutUtility.GetRect(new GUIContent(player.name), SmallFontStyle);
						GUI.Label(Rect(pt.x-rt.width*0.5*camScale,pt.y-rt.height*0.5*camScale, rt.width, rt.height), player.name,SmallFontStyle);
					}
				}
			}
			GUI.color = Color.white;
		GUI.EndGroup();
		
		
		
		
		
		//draw aim target
		if(beeCtrlScript.m_AimTarget != null)
		{
			var tgt:Vector3 = m_Camera.camera.WorldToScreenPoint(beeCtrlScript.m_AimTarget.transform.position);
			var dist = (beeCtrlScript.m_AimTarget.transform.position - transform.position).magnitude;
			var aimPt:Vector3 = m_Camera.camera.WorldToScreenPoint(transform.position+transform.forward*dist);
			tgt.y = Screen.height-tgt.y;
			aimPt.y = Screen.height - aimPt.y;
			GUI.DrawTexture(Rect(tgt.x-24*camScale,tgt.y-24*camScale, 48*camScale, 48*camScale), m_AimTargetTexture, ScaleMode.ScaleToFit, true);
			
			GUI.color.a = m_HitTargetFade;
			GUI.DrawTexture(Rect(tgt.x-48*camScale,tgt.y-48*camScale, 96*camScale, 96*camScale), m_HitTargetTexture, ScaleMode.ScaleToFit, true);
			GUI.color.a = 1;
			GUI.DrawTexture(Rect(aimPt.x-12*camScale,aimPt.y-12*camScale, 24*camScale, 24*camScale), m_AimTargetTexture, ScaleMode.ScaleToFit, true);
		}
		else
		{
			dist = 200;
			aimPt = m_Camera.camera.WorldToScreenPoint(transform.position+transform.forward*dist);
			aimPt.y = Screen.height-aimPt.y;
			GUI.DrawTexture(Rect(aimPt.x-12*camScale,aimPt.y-12*camScale, 24*camScale, 24*camScale), m_AimTargetTexture, ScaleMode.ScaleToFit, true);
			
			if(m_HitTargetEntity)
			{
				
				
				tgt = m_Camera.camera.WorldToScreenPoint(m_HitTargetEntity.transform.position);
				tgt.y = Screen.height-tgt.y;	
				GUI.color.a = m_HitTargetFade;
				GUI.DrawTexture(Rect(tgt.x-48*camScale,tgt.y-48*camScale, 96*camScale, 96*camScale), m_HitTargetTexture, ScaleMode.ScaleToFit, true);
				}
			// }
		}
		
		GUI.BeginGroup(Rect(camPos.x ,camPos.y, Screen.width*camScale, Screen.height*m_Camera.camera.rect.height));	
		var screenPos:Vector3 = m_Camera.camera.WorldToScreenPoint(gameObject.transform.position+gameObject.transform.right * 10);
		screenPos.y = Screen.height-screenPos.y - camPos.y;
		screenPos.x = screenPos.x - camPos.x;
			GUI.BeginGroup(Rect(screenPos.x+ 88* camScale, screenPos.y-64, 512,512));
			//draw Inventory boxes
			GUI.DrawTexture(Rect(right - 100*camScale,bottom - 90*camScale, 86*camScale, 86*camScale), InventoryBoxTexture, ScaleMode.ScaleToFit, true);
			GUI.DrawTexture(Rect(right - 180*camScale,bottom- 90*camScale, 86*camScale, 86*camScale), InventoryBoxTexture, ScaleMode.ScaleToFit, true);
			
			if(m_Inventory[0].m_Img != null)
			{
				GUI.DrawTexture(Rect(right - 90*camScale,bottom - 80*camScale, 66*camScale, 66*camScale), m_Inventory[0].m_Img, ScaleMode.ScaleToFit, true);
			}
			if(m_Inventory[1].m_Img != null)
			{
				GUI.DrawTexture(Rect(right - 170*camScale,bottom - 80*camScale, 66*camScale, 66*camScale), m_Inventory[1].m_Img, ScaleMode.ScaleToFit, true);
			}
			
			//draw ammo amount and reload bar
			//ammo icon
			
			var ammo : int = 0;
			if(GetComponentInChildren(ParticleEmitter) != null)
				ammo  = GetComponentInChildren(ParticleEmitter).particleCount;
			GUI.color.a = 0.75;
			if(beeCtrlScript != null && beeCtrlScript.m_ReloadTimer > 0)
			{
				ammo = 0;
				var reloadSpeed :float = beeCtrlScript.m_Stats["Reload_Speed"];
				var base : float = beeCtrlScript.m_LoadOut.m_BaseReloadSpeed;
				reloadSpeed = base -  ((reloadSpeed+1.0) /4.0)*base;
				var ReloadPerc : float = beeCtrlScript.m_ReloadTimer/reloadSpeed;
				
				//fast reload bar
				// GUI.DrawTexture(Rect(Screen.width - 255, Screen.height - 20, 15,12), HiveBarTexture, ScaleMode.StretchToFill, true);
				// //draw reload bar background
				// GUI.DrawTexture(Rect(Screen.width - 275, Screen.height - 20, 90,12), ReloadBarTexture, ScaleMode.StretchToFill, true);
				// //current reload percent
				// GUI.DrawTexture(Rect(Screen.width - 275, Screen.height - 20, 90*(1-ReloadPerc),12), ReloadBarTexture, ScaleMode.StretchToFill, true);
				
				width = 24*camScale;
				var pos:Vector2 = Vector2(width*0.5, width*0.5);
				GUI.DrawTexture(Rect(pos.x- width*0.5,pos.y- width*0.5 , width, width),ClockBGTexture);
				GUIUtility.RotateAroundPivot (-ReloadPerc*359,  Vector2(pos.x, pos.y)); 
				GUI.DrawTexture(Rect(pos.x- width*0.5 ,pos.y - width*0.5, width, width), ClockHandTexture);
				GUIUtility.RotateAroundPivot (ReloadPerc*359,  Vector2(pos.x, pos.y));
			}
			else
			{
				GUI.DrawTexture(Rect(5*camScale , camScale, 24*camScale,24*camScale), AmmoIconTexture, ScaleMode.ScaleToFit, true);
			}
			
			//ammo count 
			if(ammo == 0)
				GUI.Label(Rect(30*camScale, 0, 132*camScale,132*camScale), "--", SmallFontStyle);
			else
				GUI.Label(Rect(30*camScale, 0, 132*camScale,132*camScale), (ammo < 10 ? "0" +ammo.ToString() : ammo.ToString()), SmallFontStyle);
			
			
			//draw worker bee ratio
			//var color = NetworkUtils.GetColor(gameObject);
			//GUI.color = color;
			
			var maxWorkers:int =beeCtrlScript.m_Stats["Max_Workers"];
			maxWorkers+=1;
		
			
			var workerGenTimer:float  = beeCtrlScript.m_WorkerGenTimer;
			var workerGenTime:float  = beeCtrlScript.m_WorkerGenTime;
			var workerTimeRatio:float  = Mathf.Min(workerGenTimer/workerGenTime,1);
			if(workerTimeRatio <= 1 && m_WorkerBees == 0)
			{
				//only draw the regen timer if there is time on the clock and we are not trying to use a flower
				pos = Vector2(relPos.x - 29*camScale, relPos.y + 64*camScale);
				width = 24*camScale;
				GUI.DrawTexture(Rect(60*camScale ,0, 24*camScale, 24*camScale),ClockBGTexture);
				GUIUtility.RotateAroundPivot (-workerTimeRatio*359,  Vector2(60*camScale+12*camScale, 12*camScale)); 
				GUI.DrawTexture(Rect(60*camScale ,0, 24*camScale, 24*camScale), ClockHandTexture);
				GUIUtility.RotateAroundPivot (workerTimeRatio*359,  Vector2(60*camScale+12*camScale, 12*camScale)); 
				GUI.Label(Rect(90*camScale,0,256*camScale,48*camScale), "--",SmallFontStyle);
				if(!HasHive())
				{
					GUI.color = Color(1,1,0.5,Mathf.Sin(Time.time * 24) > 0 ? 1:0 );
					//GUI.Label(Rect(relPos.x+70*camScale,relPos.y+41*camScale,256,256), "HIVE NEEDED",SmallFontStyle);
					GUI.color = Color.white;
				}
			}
			else	
			{		
				
				GUI.DrawTexture(Rect(60*camScale ,0, 24*camScale, 24*camScale), BeeTexture, ScaleMode.StretchToFill, true);
				GUI.DrawTexture(Rect(60*camScale ,0, 24*camScale, 24*camScale), BeeWingsTexture, ScaleMode.StretchToFill, true);
				GUI.Label(Rect(90*camScale,0,256*camScale,48*camScale), m_WorkerBees.ToString(),SmallFontStyle);
				
			}
			
			
			
			GUI.color.a = 1;
			reloadSpeed = beeCtrlScript.m_Stats["Powershot_Reload"];
			base  = 1.5;
			reloadSpeed = base -  ((reloadSpeed+1.0) /4.0)*base;
			ReloadPerc = beeCtrlScript.m_PowershotReloadTimer/reloadSpeed;
			
			//powershot icon
			
			GUI.DrawTexture(Rect(20*camScale, 32*camScale, 72*camScale,12*camScale), ReloadBarTexture, ScaleMode.StretchToFill, true);	
			if(GameObject.Find(gameObject.name+"/PowerShotEffect"))
			{
				GUI.color = Color(1,1,1,Mathf.Sin(Time.time * 48) > 0 ? 1:0 );
				//powershot meter
				GUI.Label(Rect(0, 24*camScale, 132*camScale,132*camScale), "p", SmallFontStyle);
				GUI.color = Color.white;
				GUI.DrawTexture(Rect(20*camScale, 32*camScale, 72*camScale,12*camScale), ReloadBarTexture, ScaleMode.StretchToFill, true);	
				GUI.DrawTexture(Rect(20*camScale, 32*camScale, 72*camScale,12*camScale), ReloadBarTexture, ScaleMode.StretchToFill, true);	
				
			}
			else
			{
				GUI.color.a = 0.75;
				GUI.Label(Rect(0, 24*camScale, 132*camScale,132*camScale), "p", SmallFontStyle);
				GUI.color.a = 1;
				GUI.DrawTexture(Rect(20*camScale, 32*camScale, 72*(1-ReloadPerc)*camScale,12*camScale), ReloadBarTexture, ScaleMode.StretchToFill, true);	
				GUI.DrawTexture(Rect(20*camScale, 32*camScale, 72*(1-ReloadPerc)*camScale,12*camScale), ReloadBarTexture, ScaleMode.StretchToFill, true);	
				
			}
			
			var numDashes:int = beeCtrlScript.m_NumDashes;
			//stamina icon
			GUI.color.a = 0.75;
			GUI.Label(Rect(0, 46*camScale, 132*camScale,132*camScale), "s", SmallFontStyle);
			GUI.color.a = 1;
			for(i = 0; i < 3; i++)
			{
				//stamina meter background
				GUI.DrawTexture(Rect(20*camScale + i*(25)*camScale, 52*camScale, 22*camScale,12*camScale), ReloadBarTexture, ScaleMode.StretchToFill, true);
			}		
			for(i = 0; i < numDashes; i++)
			{
				//stamina meter
				GUI.DrawTexture(Rect(20*camScale + i*(25)*camScale, 52*camScale, 22*camScale,12*camScale), ReloadBarTexture, ScaleMode.StretchToFill, true);
				GUI.DrawTexture(Rect(20*camScale + i*(25)*camScale, 52*camScale, 22*camScale,12*camScale), ReloadBarTexture, ScaleMode.StretchToFill, true);
			}		
			
			
			GUI.EndGroup();
		
			var x = 128;
			if(m_XPMeterFade > 0 && m_LifeMeterFade == 0)
				x = 192;
			else if(m_XPMeterFade == 0 && m_LifeMeterFade > 0)
				x = 64;
			else if(m_XPMeterFade > 0 && m_LifeMeterFade > 0)
				x = 128;
		

			GUI.BeginGroup(Rect(screenPos.x-x, screenPos.y+64, 512,512));
			
				relPos = Vector2(0, 0);
				GUI.color.a = m_LifeMeterFade;
				if(m_LifeMeterFlashTimer > 0)
				{
					m_LifeMeterFlashTimer -= Time.deltaTime;
				}
				GUI.DrawTexture(Rect(relPos.x+15*camScale,relPos.y+6*camScale, 96*camScale, 12*camScale), MeterBarBGTexture, ScaleMode.StretchToFill, true);
				GUI.color = Color(0.2+m_LifeMeterFlashTimer,0.2+m_LifeMeterFlashTimer,0.2+m_LifeMeterFlashTimer,0.75*m_LifeMeterFade+m_LifeMeterFlashTimer*m_LifeMeterFade);
				GUI.DrawTexture(Rect(relPos.x+15*camScale,relPos.y+6*camScale, 96*camScale, 12*camScale), MeterBarTexture, ScaleMode.StretchToFill, true);
			//	var maxHP:float = GetMaxHP();
				fPerc = Mathf.Min(m_HP/maxHP, 1);
				GUI.color = Color(0.9+m_LifeMeterFlashTimer,m_LifeMeterFlashTimer,m_LifeMeterFlashTimer,m_LifeMeterFade);
				GUI.DrawTexture(Rect(relPos.x+15*camScale,relPos.y+6*camScale, fPerc*96*camScale, 12*camScale), MeterBarTexture, ScaleMode.StretchToFill, true);
				GUI.color = Color.white;
				GUI.color.a = m_LifeMeterFade;
				GUI.DrawTexture(Rect(relPos.x, relPos.y, 32*camScale, 24*camScale), m_LifeTexture, ScaleMode.StretchToFill, true);
				//GUI.Label(Rect(relPos.x+8*camScale,relPos.y+3*camScale, 128*camScale, 34*camScale), m_HP.ToString(),SmallFontStyle);
				GUI.color = Color.white;
				
				GUI.color.a = m_XPMeterFade;
				if(m_XPMeterFlashTimer > 0)
				{
					m_XPMeterFlashTimer -= Time.deltaTime;
				}
				GUI.DrawTexture(Rect(relPos.x+143*camScale,relPos.y+6*camScale, 96*camScale, 12*camScale), MeterBarBGTexture, ScaleMode.StretchToFill, true);
				GUI.color = Color(0.2+m_XPMeterFlashTimer,0.2+m_XPMeterFlashTimer,0.2+m_XPMeterFlashTimer,0.75*m_XPMeterFade+m_XPMeterFlashTimer*m_XPMeterFade);
				GUI.DrawTexture(Rect(relPos.x+143*camScale,relPos.y+6*camScale, 96*camScale, 12*camScale), MeterBarTexture, ScaleMode.StretchToFill, true);
				fPerc = 0;
				
				if(m_CurrLevel >= m_XPToLevel.length)
					fPerc = 1;
				else
					fPerc = Mathf.Min(m_CurrXP / m_XPToLevel[m_CurrLevel], 1);
				GUI.color = Color(0.9+m_XPMeterFlashTimer,0.8+m_XPMeterFlashTimer,m_XPMeterFlashTimer,m_XPMeterFade);
				GUI.DrawTexture(Rect(relPos.x+143*camScale,relPos.y+6*camScale, fPerc*96*camScale, 12*camScale), MeterBarTexture, ScaleMode.StretchToFill, true);
				GUI.color = Color.white;
				GUI.color.a = m_XPMeterFade;
				GUI.DrawTexture(Rect(relPos.x+128*camScale, relPos.y, 24*camScale, 24*camScale), CoinTexture, ScaleMode.StretchToFill, true);
				GUI.color = Color(1-m_XPMeterFlashTimer*3,1-m_XPMeterFlashTimer*3,1*m_XPMeterFade-m_XPMeterFlashTimer*3*m_XPMeterFade);
				//GUI.Label(Rect(relPos.x+8*camScale,relPos.y+3*camScale, 128, 34), "Lv "+(m_CurrLevel+1),SmallFontStyle);
				GUI.color = Color.white;
			GUI.EndGroup();
		GUI.EndGroup();
		
		//draw money amount
		// var money : String;
		// if(m_Money < 100)
		 // money += "0";
		// if(m_Money < 10)
			// money += "0";
		
		// GUI.Label(Rect(right - 135, bottom - 135, 132,132), "$"+money+m_Money, FontStyle);
	//}
}



function Show(show:boolean)
{
	if(!show)
	{
		for(var child:Transform in transform)
		{
			if(child.gameObject.renderer != null)
				child.gameObject.renderer.enabled = false;
		}
		transform.Find("Bee/NewBee/NewBee").gameObject.renderer.enabled = false;
		transform.Find("Bee/NewBee/BeeArmor").gameObject.renderer.enabled = false;
		transform.Find("Bee/NewBee/body/r_shoulder/r_arm/r_hand/gun").gameObject.renderer.enabled = false;
		if(transform.Find("Bee/NewBee/body/head/swag") != null)
			transform.Find("Bee/NewBee/body/head/swag").gameObject.renderer.enabled = false;
	}
	else
	{	
		for(var child:Transform in transform)
		{
			if(child.gameObject.renderer != null)
				child.gameObject.renderer.enabled = true;
		}
		transform.Find("Bee/NewBee/NewBee").gameObject.renderer.enabled = true;
		transform.Find("Bee/NewBee/BeeArmor").gameObject.renderer.enabled = true;
		transform.Find("Bee/NewBee/body/r_shoulder/r_arm/r_hand/gun").gameObject.renderer.enabled = true;
		if(transform.Find("Bee/NewBee/body/head/swag") != null)
			transform.Find("Bee/NewBee/body/head/swag").gameObject.renderer.enabled = true;
	}
}

@RPC function DeflectBullet()
{
	gameObject.AddComponent(PauseDecorator);
	GetComponent(PauseDecorator).m_Lifetime = 0.25;
	var deflectEffect:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/BeeDashEffectParticles"),transform.position, Quaternion.identity);
	 deflectEffect.transform.parent = transform;
	 deflectEffect.GetComponent(ParticleSystem).startRotation = Mathf.Acos(Vector3.Dot(GetComponent(UpdateScript).m_Vel.normalized,Vector3.forward));
	
	  if(GetComponent(UpdateScript).m_Vel.x < 0)
		  deflectEffect.GetComponent(ParticleSystem).startRotation = 2*Mathf.PI-deflectEffect.GetComponent(ParticleSystem).startRotation;
	 deflectEffect.GetComponent(ParticleSystem).startRotation += 0.785;
}

function OnControllerColliderHit (hit : ControllerColliderHit) {

	
	if(Network.isServer)
	{
		if(GetComponent(BeeDashDecorator) != null &&
		hit.collider.gameObject.tag == "Trees")
		{
			var vel:Vector3 =  GetComponent(UpdateScript).m_Vel;
			var norm:Vector3 = (transform.position - hit.collider.transform.position);
			norm.y = 0;
			
			if(Vector3.Dot(vel.normalized, hit.normal) < -0.7)
			{			
			 Destroy(GetComponent(BeeDashDecorator));
			 m_Camera.GetComponent(CameraScript).Shake(0.25,1.5);
			 GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			
			 GetComponent(UpdateScript).m_Vel = Vector3.Reflect( GetComponent(UpdateScript).m_Vel, norm.normalized) ;
		//	 gameObject.AddComponent(ControlDisablerDecorator);
		//	GetComponent(ControlDisablerDecorator).SetLifetime(0.25);
			}
			
		}
		else if(hit.collider.gameObject.tag == "Bears")
		{
				
		}
		else if(hit.collider.gameObject.name == "BearAttackParticles(Clone)")
		{
				Debug.Log("Thanks");
		}
	
	}
}

function OnBulletCollision(coll:BulletCollision)
{
	if(gameObject.GetComponent(InvincibilityDecorator) == null && gameObject.GetComponent(HammerDecorator) == null)
	{	
		if(GetComponent(BeeDashDecorator) != null)
		{
			coll.bullet.GetComponent(UpdateScript).m_Vel = Vector3.Reflect(coll.bullet.GetComponent(UpdateScript).m_Vel, GetComponent(UpdateScript).m_Vel.normalized);
			networkView.RPC("DeflectBullet", RPCMode.All);
		}
		else
		if(coll.bullet.GetComponent(BulletScript).m_PowerShot )
		{
			if(coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).m_Team != m_Team)
			{
				//hit by a powershot 
				//we got hit by a bullet
				if(GetComponent(ItemDecorator) != null)
				{
					//drop item if we have it out
					ServerRPC.Buffer(networkView, "ThrowItem", RPCMode.All);
				}
				if(m_HP - 3 <= 0)
				{
					networkView.RPC("SendGameEventMessage", RPCMode.All, NetworkUtils.GetClientObjectFromGameObject(coll.bullet.GetComponent(BulletScript).m_Owner).m_Name+" stung "+NetworkUtils.GetClientObjectFromGameObject(gameObject).m_Name);
					coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).m_Kills++;
					KillAndRespawn(true);
					CoinScript.SpawnCoins(transform.position, 3, coll.bullet.GetComponent(BulletScript).m_Owner);
					//notify shooting player of contact
					coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).HitTargetFade(gameObject);
				}
				else
				{
					
					networkView.RPC("SetHP", RPCMode.All, m_HP - 3);
					
					//notify shooting player of contact
					coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).HitTargetFade(gameObject);
				}
			}
		}
		else
		{
			
			if(coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).m_Team != m_Team)
			//if(coll.bullet.GetComponent(BulletScript).m_Owner != gameObject)
			{
				//we got hit by a bullet
				if(GetComponent(ItemDecorator) != null)
				{
					//drop item if we have it out
					ServerRPC.Buffer(networkView, "ThrowItem", RPCMode.All);
				}
				
				if(m_HP - 1 <= 0)
				{
					networkView.RPC("SendGameEventMessage", RPCMode.All, NetworkUtils.GetClientObjectFromGameObject(coll.bullet.GetComponent(BulletScript).m_Owner).m_Name+" splatted "+NetworkUtils.GetClientObjectFromGameObject(gameObject).m_Name);
					coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).m_Kills++;
					CoinScript.SpawnCoins(transform.position, 3, coll.bullet.GetComponent(BulletScript).m_Owner);
					KillAndRespawn(true);
					
					//notify shooting player of contact
					coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).HitTargetFade(gameObject);
				}
				else
				{
				
					networkView.RPC("SetHP", RPCMode.All, m_HP - 1);
					
					//notify shooting player of contact
					coll.bullet.GetComponent(BulletScript).m_Owner.GetComponent(BeeScript).HitTargetFade(gameObject);
				}
			}
		}
	}
}

function OnCollisionEnter(coll : Collision) {

	//if we dash and hit an object we should shake the camera
	if(Network.isServer)
	{
		if(coll.gameObject.tag == "Hammer" && coll.gameObject.GetComponent(HammerScript).m_Owner != gameObject)
		{
			networkView.RPC("SendGameEventMessage", RPCMode.All, NetworkUtils.GetClientObjectFromGameObject(coll.gameObject.GetComponent(HammerScript).m_Owner).m_Name+" pounded "+NetworkUtils.GetClientObjectFromGameObject(gameObject).m_Name);
			KillAndRespawn(true);
		}
	}
}

function OnTriggerEnter(other:Collider)
{
	if(Network.isServer)
	{
		if(other.gameObject.tag == "Sprinkler" && GetComponent(InvincibilityDecorator) == null)
		{
			//we got hit by a sprinkler
			if(GetComponent(ItemDecorator) != null)
			{
				//drop item if we have it out
				ServerRPC.Buffer(networkView, "ThrowItem", RPCMode.All);
			}
			var point : Vector3 = transform.position - other.transform.position;
			var dot:float = Vector3.Dot(point, other.gameObject.transform.right);
			point = other.gameObject.transform.right*dot;
			transform.position += point.normalized *10;
			GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
		
			if(m_HP - 1 == 0)
			{
				KillAndRespawn(true);
			}
			else
				networkView.RPC("SetHP", RPCMode.All, m_HP - 1);
		}
		
		else if(other.gameObject.tag == "Explosion" && other.gameObject.GetComponent(BombExplosionScript).m_Owner != gameObject)
		{
			Debug.Log("Why");
			KillAndRespawn(true);
		}
		else if(other.gameObject.tag == "Bears" && other.gameObject.GetComponentInChildren(BearScript).m_RageTimer > 0)
		{
			Debug.Log(other.gameObject.name);
			KillAndRespawn(true);
		}
		else if(other.gameObject.name == "BearAttackParticles(Clone)" )
		{
			KillAndRespawn(true);
		}
		else
		if(other.gameObject.tag == "Water")
		{
			ServerRPC.Buffer(gameObject.networkView, "Drown", RPCMode.All,Vector3.up);	
		}
	}
}

function OnNetworkInstantiate (info : NetworkMessageInfo) 
{
    Debug.Log("New " +gameObject.name+ " instantiated");
}

function FindRespawnLocation() : Vector3
{
		var locs:GameObject[] = gameObject.FindGameObjectsWithTag("Hives");
		var pos:Vector3;
		var clientInfo:ClientNetworkInfo = NetworkUtils.GetClientObjectFromGameObject(gameObject);
		for(var i:int = 0; i < locs.length; i++)
		{
			
			if(locs[i].GetComponent(RespawnScript).m_TeamOwner == clientInfo.m_Side)
			{
				locs[i].renderer.material.color = clientInfo.m_Color;
				locs[i].transform.Find("Swarm").gameObject.renderer.material.SetColor("_TintColor", clientInfo.m_Color);
				var offset:Vector3 = Vector3(Random.Range(-1,1), 0, Random.Range(-1,1));
				offset = offset.normalized *locs[i].GetComponent(RespawnScript).m_Radius;
				pos= locs[i].transform.position+offset;
				pos.y = 350;
				return pos;
			}
		}
		// var index:int = Random.Range(0, locs.length-1);
		// var pos:Vector3 = locs[index].transform.position;
		// pos.y = 350;
		return pos;
}

function KillAndRespawn(splat:boolean)
{
	if(GetComponent(RespawnDecorator) != null)
		return;
	
	ServerRPC.Buffer(networkView, "KillBee", RPCMode.All, splat);
	var pos:Vector3 = FindRespawnLocation();
	ServerRPC.Buffer(networkView,"Respawn", RPCMode.All,pos);
}

function HasHive():boolean
{
	var hives:GameObject[] = GameObject.FindGameObjectsWithTag("Hives");
	for( var i : int = 0; i < hives.length; i++)
	{
		if(hives[i].GetComponent(HiveScript).m_Owner == gameObject)
			return true;
	}
	return false;
}

function GetNumFlowers() : int
{
	var flowers:GameObject[] = GameObject.FindGameObjectsWithTag("Flowers");
	var num:int = 0;
	for( var i : int = 0; i < flowers.length; i++)
	{
		if(flowers[i].GetComponent(FlowerScript)!= null)
			if(flowers[i].GetComponent(FlowerScript).m_Owner == gameObject)
				num++;
	}
	if(num > m_LongestChain)
		m_LongestChain = num;
	return num;
}

function GetHoneyRate() : int
{
	var honeyRate = 0;
	var flowerGroups : GameObject[] = GameObject.FindGameObjectsWithTag("FlowerGroup"); 
	for(var group:GameObject in flowerGroups)
	{
		honeyRate+=group.GetComponent(FlowerGroupScript).CalcScoreForBee(gameObject);
	}
	return honeyRate;
}

function GetHoneyRateRank() : int
{
	var bees:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
	var place:int = bees.length;
	for( var i : int = 0; i < bees.length; i++)
	{
		if(bees[i].GetComponent(BeeScript).GetHoneyRate() < GetHoneyRate())
			place--;
	}
	return place;
}

function CalculateFlowerRank() : int
{

	var bees:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
	var place:int = bees.length;
	for( var i : int = 0; i < bees.length; i++)
	{
		if(bees[i].GetComponent(BeeScript).GetNumFlowers() < GetNumFlowers())
			place--;
	}
	return place;
}

function CalculateRank() : int
{
	var bees:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
	var place:int = bees.length;
	for( var i : int = 0; i < bees.length; i++)
	{
		if(bees[i].GetComponent(BeeScript).m_Honey < m_Honey)
			place--;
	}
	return place;
}

@RPC function KillBee(splat:boolean)
{	
     m_HP = 0;
	 m_Deaths++;
	//play death effect
	if(splat)
	{
		
		// var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/EventText"));
		// txt.GetComponent(GUIText).text = "You Died!";
		// txt.layer = LayerMask.NameToLayer("GUILayer_P"+(GetComponent(NetworkInputScript).m_ClientOwner+1));	
		
		var gb : GameObject = gameObject.Instantiate(m_HitEffect);
		gb.transform.position = transform.position;
		gb.transform.localScale = Vector3(10.1, 10.1, 10.1);
		var ps : ParticleSystem = gb.GetComponent(ParticleSystem) as ParticleSystem;
		
		var color = NetworkUtils.GetColor(gameObject);
		gb.renderer.material.SetColor("_TintColor", color);
		ps.startSize = 16;

		ps = gb.transform.Find("GrenadeInnerExplosion").GetComponent(ParticleSystem) as ParticleSystem;
		ps.gameObject.renderer.material.SetColor("_TintColor", color);
		ps.startSize = 10;
		ps = gb.transform.Find("GrenadeRing").GetComponent(ParticleSystem) as ParticleSystem;
		//ps.gameObject.renderer.material.SetColor("_TintColor", renderer.material.color);
		ps.startSize = 30;
		
		var go : GameObject = gameObject.Instantiate(m_DeathEffect);
		go.transform.position = transform.position;
		go.renderer.material.color = color;
		
		var splatter:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/Splatter", GameObject));
		splatter.transform.position = GetComponent(TerrainCollisionScript).m_TerrainInfo.point + Vector3.up*01;
		splatter.transform.rotation = Quaternion.AngleAxis(Random.Range(0, 360), Vector3.up);
		splatter.renderer.material.SetColor("_TintColor", NetworkUtils.GetColor(gameObject));
		splatter.transform.localScale *= 1.5;
		
		var deathEffect:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/ExplosionParticles"));
		deathEffect.transform.position = transform.position + Vector3(0,12,0);
		deathEffect.transform.GetChild(0).gameObject.renderer.material.SetColor("_TintColor", NetworkUtils.GetColor(gameObject));
		deathEffect.transform.GetChild(1).gameObject.renderer.material.SetColor("_TintColor", NetworkUtils.GetColor(gameObject));
		// for(var i:int = 0; i < 6; i++)
		// {
			// var splatter:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/Splatter", GameObject));
			// var ray:Vector3 = Random.onUnitSphere;
			// if(ray.y > 0)
				// ray.y = -ray.y;
			// var hit:RaycastHit;	
			// Physics.Raycast(transform.position,ray,hit,Mathf.Infinity,GetComponent(TerrainCollisionScript).m_TerrainLayer);
			// splatter.transform.position = hit.point + hit.normal*01;
			// splatter.transform.rotation = Quaternion.AngleAxis(Random.Range(0, 360), hit.normal);
			// splatter.renderer.material.color = color;
		// }
		
		if(NetworkUtils.IsLocalGameObject(gameObject))
		{
			AudioSource.PlayClipAtPoint(m_DeathSound, m_Camera.transform.position);
			m_Camera.GetComponent(CameraScript).Shake(0.25,5);
			Hurt();
		}
	}
	
	if(GetComponent(ItemDecorator) != null)
	{
		//gameObject.Destroy(GetComponent(ItemDecorator).GetItem());
		GetComponent(ItemDecorator).ThrowItem();
	}
	
	//kill any left over powershot stuff if the player died while charging one
	GetComponent(BeeControllerScript).m_ShootButtonTimeHeld = 0;
	GetComponent(BeeControllerScript).m_ShootButtonHeld = false;
	var powershotEffect : Transform = transform.Find("PowerShotEffect");
	if(powershotEffect != null)
		Destroy(powershotEffect.gameObject);
	
	var comps:Component[] = gameObject.GetComponents(Component);
	for (var comp:Component in comps)
	{
		//Debug.Log(comp.ToString());
		if(comp.ToString().Contains("decorator") || comp.ToString().Contains("Decorator"))
		{
			//DestroyImmediate(comp);
			Destroy(comp);
		}
	}
	
	//var pos:Vector3 = FindRespawnLocation();
	//Respawn( pos);
	// if(GetComponent(InvincibilityDecorator) != null)
		// gameObject.DestroyImmediate(gameObject.GetComponent(InvincibilityDecorator));
	// if(GetComponent(DizzyDecorator) != null)
		// gameObject.Destroy(gameObject.GetComponent(DizzyDecorator));
	
	
}

@RPC function Respawn(pos:Vector3)
{
	m_Money = 0;
	m_CurrXP = 0;
	Debug.Log("Respawning");
	
	gameObject.AddComponent(RespawnDecorator);
	GetComponent(RespawnDecorator).SetLifetime(3);
	GetComponent(RespawnDecorator).m_RespawnPos = pos;
}

function Hurt()
{
	//m_Camera.GetComponent(MotionBlur).enabled = true;
	var gui : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/HurtGUI"));
	gui.GetComponent(GUIScript).SetCamera(m_Camera);
	gui.GetComponent(GUIScript).m_Depth = -999999;
	while(gui.GetComponent(GUIScript).m_ImgColor.a > 0)
	{
		gui.GetComponent(GUIScript).m_ImgColor.a -= 1.0/30.0;
		yield WaitForSeconds(1/30.0);
	}
	
	Destroy(gui);
	m_Camera.GetComponent(MotionBlur).enabled = false;
	
}

@RPC function SetShieldHP(hp:int)
{
	m_ShieldHP = hp;
	if(hp <= 0)
	{
		
		if(GetComponent(FlowerDecorator) != null)
		{
			//knock us off the flower
			Destroy(GetComponent(FlowerDecorator));
		}
		gameObject.AddComponent(DizzyDecorator);
		m_ShieldHP = 10;
	}
	else
	{
		if(GetComponent(FlowerDecorator) != null)
		{
			 var shield:GameObject = GetComponent(FlowerDecorator).m_FlowerShieldEffect;
			 shield.GetComponent(SphereCollider).radius *= 1.1; 
			 shield.transform.localScale *= .9;
			 var parts :ParticleSystem.Particle[] = new ParticleSystem.Particle[shield.GetComponent(ParticleSystem).particleCount];
			 shield.GetComponent(ParticleSystem).startSize *= 0.9;
			 shield.GetComponent(ParticleSystem).GetParticles(parts);
			 for(var i = 0; i < parts.length; i++)
			 {
				 parts[i].size *= 0.9;
			 }
			 shield.GetComponent(ParticleSystem).SetParticles(parts, parts.length);
		}
	}

	
}

@RPC function SetHP(hp:int)
{
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_LifeMeterFlashTimer = 0.25;
		FadeOutLifeMeter(2);
	}
	
	//we are still alive
	if(hp < m_HP && hp > 0)
	{
		//add invincibility decorator
		gameObject.AddComponent(InvincibilityDecorator);
		gameObject.GetComponent(InvincibilityDecorator).m_Blink = false;
		GetComponent(InvincibilityDecorator).SetLifetime(0.1);
		if(GetComponent(FlasherDecorator) == null)
		{
			gameObject.AddComponent(FlasherDecorator);
			GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
			GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
		}
		
		if(NetworkUtils.IsLocalGameObject(gameObject))
		{
			AudioSource.PlayClipAtPoint(m_HurtSound, m_Camera.transform.position);
			Hurt();
			m_Camera.GetComponent(CameraScript).Shake(0.25, 2);
		}
	}
	
	if(hp <= 0)
	{
		hp = 0;
		if(Network.isServer)
		{
			var pos:Vector3 = FindRespawnLocation();
			networkView.RPC("Respawn", RPCMode.All, pos);
		}
	}
	
	m_HP = hp;
}

@RPC function SetHoneyPoints(pts:int)
{
	m_Honey = pts;
}

@RPC function Daze(velEnabled : boolean)
{
	if(gameObject.GetComponent(DizzyDecorator) == null)
	{
		gameObject.AddComponent(DizzyDecorator);
		gameObject.GetComponent(DizzyDecorator).m_EnableVel = velEnabled;
		
		if(Network.isServer)
		{
			if(GetComponent(ItemDecorator) != null &&
			   GetComponent(ItemDecorator).GetItem().tag == "Rocks")
			   {
				 networkView.RPC("ThrowRock",RPCMode.All,GetComponent(ItemDecorator).GetItem().name);
			   }
		}
	}
}

@RPC function GenerateWorkerBee()
{
	var maxBees:int = GetComponent(BeeControllerScript).m_Stats["Max_Workers"];
	maxBees = m_MaxWorkerBees + maxBees+1;
	if(maxBees > m_WorkerBees)
	{
		m_WorkerBees = maxBees;
		//if(maxBees > m_WorkerBees)
			//GetComponent(BeeControllerScript).m_WorkerGenTimer = GetComponent(BeeControllerScript).m_WorkerGenTime;
	}
	
}

@RPC function AddWorkerBee(tgt : String,  offset : Vector3)
{

	var go : GameObject = gameObject.Instantiate(m_WorkerBeeInstance);
	go.GetComponent(WorkerBeeScript).m_Owner = gameObject;
	var color = NetworkUtils.GetColor(gameObject);
	go.renderer.material.color= color;
	//Debug.Log("adding swarm to "+tgt);
	if(tgt != "")
	{
		var Target : GameObject = gameObject.Find(tgt);
		go.name = go.name+Target.name;
		go.transform.position = Target.transform.position + offset;
		go.transform.parent = Target.transform;
		
	}
	else
	{
		go.transform.position = transform.position + offset;
		go.transform.parent = transform;
		go.name = go.name+gameObject.name;
	}
	
	if(NetworkUtils.IsLocalGameObject(gameObject))
	{
		m_Camera.GetComponent(CameraScript).Shake(0.25, 2);
	}
	
	var flowerDec :FlowerDecorator = GetComponent(FlowerDecorator);
	if(flowerDec != null)
	{
		GetNumFlowers();
		m_WorkerBees--;
		flowerDec.m_FlashTimer = 1;
		flowerDec.Reset();
		flowerDec.m_SwarmCreated = true;
		var workerGen: int = GetComponent(BeeControllerScript).m_Stats["Worker_Generation"];
		GetComponent(BeeControllerScript).m_WorkerGenTimer = Mathf.Max(1,GetComponent(BeeControllerScript).m_WorkerGenTime - workerGen);
		
		
		var flowerComp:FlowerScript = gameObject.Find(tgt).GetComponent(FlowerScript);
		//the sanity check for this going value going above max happens in the flower decorator which fires this RPC
		flowerComp.m_NumBees++;
		flowerComp.m_HP += flowerComp.m_BaseHP;
		flowerComp.m_Owner = gameObject;
		if(flowerComp.m_NumBees >= flowerComp.m_MaxBees)
		{
			flowerDec.m_ProgressEffect.active = false;
		}
		
		
		if(NetworkUtils.IsLocalGameObject(gameObject))
		{
			var kudosText:GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
			kudosText.GetComponent(GUIText).material.color = Color.yellow;
			kudosText.GetComponent(KudosTextScript).m_WorldPos = transform.position;
			kudosText.GetComponent(UpdateScript).m_Lifetime = 2;
			//gameObject.GetComponent(BeeScript).m_Money +=  25;
			if(flowerComp.m_NumBees > 1)
				kudosText.GetComponent(GUIText).text = "+ "+(flowerComp.m_NumBees-1)+" Defense";
			else
				kudosText.GetComponent(GUIText).text = "Captured!";
			
			kudosText.GetComponent(KudosTextScript).m_CameraOwner = m_Camera;
			kudosText.layer = LayerMask.NameToLayer("GUILayer_P"+(GetComponent(NetworkInputScript).m_ClientOwner+1));
		}
		if(flowerComp.m_NumBees == 1)
			GameEventMessenger.QueueMessage(NetworkUtils.GetClientObjectFromGameObject(gameObject).m_Name+ " captured a flower");
				
		//see if flower is part of a group
		if(flowerDec.GetFlower().transform.parent != null)
		{
			var group:FlowerGroupScript = flowerDec.GetFlower().transform.parent.GetComponent(FlowerGroupScript);
			var level:int = group.CheckForLevelup(flowerDec.GetFlower());
		
			if(level == 0)
			{
				//nothing
	
			}
			else
			if(level == 1)
			{
				if(NetworkUtils.IsLocalGameObject(gameObject))
				{
					var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/EventText"));
					txt.GetComponent(GUIText).text = "+ "+level+" Group Honey Production";
					txt.layer = LayerMask.NameToLayer("GUILayer_P"+(GetComponent(NetworkInputScript).m_ClientOwner+1));
				}
				group.Flash();
			}
			else
			{
				if(NetworkUtils.IsLocalGameObject(gameObject))
				{	
					txt  = gameObject.Instantiate(Resources.Load("GameObjects/EventText"));
					txt.GetComponent(GUIText).text = "+ "+level+" Group Honey Production";
					txt.layer = LayerMask.NameToLayer("GUILayer_P"+(GetComponent(NetworkInputScript).m_ClientOwner+1));
				}
				group.Flash();
			}
		}
	
		
		//flowerDec.GetFlower().GetComponent(PollenNetworkScript).m_Owner = gameObject;
		flowerDec.GetFlower().animation.Play("Flower");
		AudioSource.PlayClipAtPoint(flowerComp.m_BuildComplete, transform.position);
	}
	
	
} 


@RPC function AddSwarm(tgt : String,  offset : Vector3, numBees : int)
{
	var go : GameObject = gameObject.Instantiate(m_SwarmInstance);
	
	go.GetComponent(BeeParticleScript).m_Owner = gameObject;
	var color = NetworkUtils.GetColor(gameObject);
	go.renderer.material.color= color;
	go.renderer.material.SetColor("_TintColor", color);
	//Debug.Log("adding swarm to "+tgt);
	if(tgt != "")
	{
		var Target : GameObject = gameObject.Find(tgt);
		//go.GetComponent(BeeParticleScript).SetPosition();
		go.name = "Swarm"+Target.name;
		go.transform.position = Target.transform.position + offset;
		go.transform.parent = Target.transform;
		
	}
	else
	{
		go.transform.position = transform.position + offset;
		go.transform.parent = transform;
		go.name = "Swarm"+gameObject.name;
	}
	go.GetComponent(BeeParticleScript).SetNumParticles(numBees);
} 

@RPC function AddBeesToSwarm(swarmParent : String, numBees : int)
{
	var go : GameObject = gameObject.Find(swarmParent);
	for(var i : int = 0; i < numBees; i++)
	{
		go.GetComponentInChildren(BeeParticleScript).AddParticle();
	}
}

@RPC function RemoveBeesFromSwarm(swarmParent : String, numBees : int)
{
	var go : GameObject = gameObject.Find(swarmParent);
	if(go.tag == "Player")
	{
		if(go.GetComponentInChildren(ParticleEmitter).particleCount - numBees <= 0)
			go.GetComponent(BeeControllerScript).m_ReloadTimer = go.GetComponent(BeeControllerScript).m_ReloadTime;
	}
	
	if(go.GetComponentInChildren(BeeParticleScript) != null)
	{
		for(var i:int = 0; i  < numBees; i++)
		{
			go.GetComponentInChildren(BeeParticleScript).RemoveParticle();	
		}
	}
}






@RPC function PollenCashIn(beeName:String, hiveName:String)
{
	//var beeObj:GameObject = GameObject.Find(beeName);
	//var bee:BeeScript = GetComponent(BeeScript);
	if(m_PollenCount > 0)
	{
		Debug.Log("Cash");
		var hive:GameObject = gameObject.Find(hiveName);
		var bonus = m_PollenCount / 3 * 50;
		m_Money += m_PollenCount * 10;
		if(GetComponent(FlasherDecorator) == null)
			gameObject.AddComponent(FlasherDecorator);
		transform.localScale = Vector3(2,2,2);
	
		var particles:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/PollenAbsorptionParticles"));
		particles.transform.position = hive.transform.position+Vector3.up * 20;
		particles.name = "Pollen";
		
		gameObject.AddComponent(HoneyDepositDecorator);
		GetComponent(HoneyDepositDecorator).m_Lifetime = 2;
		GetComponent(HoneyDepositDecorator).m_Hive = hive;
		GetComponent(HoneyDepositDecorator).m_PollenCount = m_PollenCount;
		m_Honey += (m_PollenCount+ ((m_PollenCount / 3) *2));
		
		audio.PlayClipAtPoint(m_CashInSound, transform.position);
		
		// if(NetworkUtils.IsControlledGameObject(gameObject))
		// {
			// var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
			// txt.GetComponent(KudosTextScript).m_WorldPos = hive.transform.position+Vector3.up*20;
			// txt.GetComponent(UpdateScript).m_Lifetime = 2;
			// txt.GetComponent(GUIText).text = "+ $"+m_PollenCount*10;
			// txt.GetComponent(GUIText).material.color = Color.yellow;
			// var myPos:Vector3 = gameObject.transform.position;
			// myPos.y = 0;
			// var camPos:Vector3 = Camera.main.transform.position;
			// camPos.y = 0;
			// //Camera.main.GetComponent(CameraScript).m_CamPos +=  (myPos-camPos) - Camera.main.GetComponent(CameraScript).m_Offset;
		// }
		m_PollenCount = 0;
	}
} 

@RPC function Drown(offset:Vector3)
{
	GameEventMessenger.QueueMessage(NetworkUtils.GetClientObjectFromGameObject(gameObject).m_Name+" went for a swim");
	gameObject.AddComponent(DrowningDecorator);		
	//transform.position -= offset;
}

@RPC function Burn()
{
	
	
	if(GetComponent(BurningDecorator) == null)
		gameObject.AddComponent(BurningDecorator);
}

@RPC function CreateHive(pos:Vector3)
{
	GameEventMessenger.QueueMessage(NetworkUtils.GetClientObjectFromGameObject(gameObject).m_Name+" built a hive");
	var go : GameObject = gameObject.Instantiate(Resources.Load("GameObjects/Hive"));
	go.name = go.name+gameObject.name;
	go.renderer.material.color = m_Color;
	go.transform.position = pos; 
	//go.transform.localScale *= 20;
	go.GetComponent(HiveScript).m_Owner = gameObject;
	go.GetComponent(HiveScript).m_Pedestal = GetComponent(PedestalDecorator).m_Pedestal;
	go.GetComponent(HiveScript).m_Pedestal.GetComponent(HivePedestalScript).m_Hive = go;
	GetComponent(BeeControllerScript).m_NearestObject = go;
	if(NetworkUtils.IsLocalGameObject(gameObject) )
	{
		var txt : GameObject  = gameObject.Find("GUITexture");	
		txt.transform.position = m_Camera.camera.WorldToViewportPoint(transform.position);
		txt.transform.position.y += 0.03;
		if(!txt.GetComponent(GUITexture).enabled)
		{
			txt.GetComponent(GUITexture).enabled = true;
			txt.animation.Play();
		}
	}
	GetComponent(PedestalDecorator).m_Pedestal.GetComponent(PollenNetworkScript).m_Owner = gameObject;
	
	GetComponent(PedestalDecorator).m_HiveCreated = true;
	AudioSource.PlayClipAtPoint(GetComponent(PedestalDecorator).m_Pedestal.GetComponent(HivePedestalScript).m_BuildComplete, transform.position);
	
	
}

@RPC function SendGameEventMessage(msg : String)
{
	GameEventMessenger.QueueMessage(msg);
}

function GetMaxHP():int
{
	var health:int =GetComponent(BeeControllerScript).m_Stats["Health"];
	return (3.0 + (health+1));
}
