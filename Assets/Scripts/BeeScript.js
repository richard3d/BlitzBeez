#pragma strict

class Inventory
{
	var m_Img : Texture2D = null;
	var m_Item : GameObject = null;	 
}

var m_SwarmInstance : GameObject = null;
var m_WorkerBeeInstance : GameObject = null;
var m_DeathEffect : GameObject = null;
var m_HitEffect : GameObject = null;
var m_DazeEffect : GameObject = null;
//var m_HoneycombCount : int = 0; //how many honey comb items have we collected? when this number reaches 3 the honey comb item will spawn a hive for us

var m_CashInSound:AudioClip;

var m_GroundPosition:Vector3;
var m_GroundPositionVel:Vector3;
var m_Bounce : boolean = true;
var m_CanTeleport : boolean = false;
var m_HP : int = 3;
var m_WorkerBees:int = 3;
var m_MaxWorkerBees:int = 3;
var m_Money : int = 0;
var m_PollenCount:int = 0;
var m_Honey:int = 0;
var m_HoneyInterpolator:float = 0;
// var m_CurrXP : int = 0;
// var m_CurrLevel : int = 0;
// var m_XPToLevel : int[];

// var m_CurrSwmXP : float = 0;
// var m_CurrSwmLevel : int = 0;
// var m_XPToSwmLevel : int[];

var HandIconTexture : Texture2D = null;
var XPText : GameObject = null;
var BarBGTexture : Texture2D = null;
var m_LifeTextureContainer : Texture2D = null;
var m_LifeTexture : Texture2D = null;
var LifeBarTexture : Texture2D = null;
var LifeBarBGTexture : Texture2D = null;
var HiveBarTexture : Texture2D = null;
var HiveBarBGTexture : Texture2D = null;
var InventoryBoxTexture : Texture2D = null;
var ReloadBarTexture : Texture2D = null;
var AmmoIconTexture : Texture2D = null;
var PollenMeterTexture : Texture2D = null;
var CrownTexture : Texture2D = null;
var BeeTexture : Texture2D = null;
var HiveTexture:Texture2D = null;
var NodeTexture:Texture2D = null;
var CaptureRingTexture:Texture2D = null;
var NodeLineTexture:Texture2D = null;

var m_FocusedGroupNum:int = -1;
var m_FocusedObject:GameObject = null;
var m_DraggedFocusObject:GameObject = null;
var FontStyle : GUIStyle = null;

var m_Inventory : Inventory[];

var m_ViewMap:boolean = false;

function Awake()
{
	m_Inventory = new Inventory[2];
	m_Inventory[0] = new Inventory();
	m_Inventory[1] = new Inventory();
}

function Start () {
	m_Money = 0;
}

function Update () {
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
		//GetComponent(UpdateScript).m_Accel.y = 0;
		GetComponent(UpdateScript).m_Vel.y = 0;
	}
	if(Network.isServer)
	 {	
	 
		
		//m_GroundPositionVel.y -= 299.8*Time.deltaTime;
		// if(m_GroundPosition.y+ m_GroundPositionVel.y * Time.deltaTime >= Terr.m_TerrainInfo.point.y)
		// {
			
			// m_GroundPosition.y += m_GroundPositionVel.y* Time.deltaTime;
			// //m_Bounce = false;
			// GetComponent(TrailRenderer).enabled = true;
			
		// //	Debug.Log("falling from height "+ (m_GroundPosition.y - Terr.m_TerrainInfo.point.y));
		// }
		// else
		// {
		// //	Debug.Log("Setting to ground level "+Terr.m_TerrainInfo.point);
			// m_GroundPosition.y = Terr.m_TerrainInfo.point.y;
			// m_GroundPositionVel.y = 0;
			// //m_Bounce = true;
		// }
		
		if(coll != null && coll.gameObject.tag == "Water" && GetComponent(DrowningDecorator) == null)
		{
			var offset:Vector3 = Vector3.zero;//(coll.gameObject.transform.position -  transform.position).normalized*coll.gameObject.transform.localScale.magnitude*4 ;
			ServerRPC.Buffer(gameObject.networkView, "Drown", RPCMode.All,offset);
		}
		// if(m_Bounce)
		// {
			// transform.position.y = m_GroundPosition.y + 6 + (Mathf.Sin(Time.time*26)+2)*0.5;
		// }
		// else
		// {
			// transform.position.y = m_GroundPosition.y + 6;
		// }
	}
	if(Input.GetKeyDown(KeyCode.LeftControl))
	{
		m_ViewMap = !m_ViewMap;
		if(m_ViewMap)
		{
			GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
			GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			Camera.main.GetComponent(CameraScript).m_CamVel = Vector3(0,0,0);
			
			Camera.main.orthographicSize = 400;
			Screen.showCursor = true;
			
			Camera.main.transform.position.x = gameObject.transform.position.x;
			Camera.main.transform.position.z = gameObject.transform.position.z;
		}
		else
		{
			Screen.showCursor = false;
		}
	}
	
	if(m_ViewMap)
	{
		Camera.main.transform.eulerAngles = Vector3(90,0,0);
		Camera.main.orthographic = true;
		
		
		GetComponent(BeeControllerScript).m_ControlEnabled = false;
		GetComponent(BeeControllerScript).m_LookEnabled = false;
	}
	else
	{
		m_ViewMap = false;
		Camera.main.GetComponent(Camera).orthographic = false;
	
		GetComponent(BeeControllerScript).m_ControlEnabled = true;
		GetComponent(BeeControllerScript).m_LookEnabled = true;
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

function OnGUI()
{	
	//GUI.Label(Rect(10, 10, 400,400), "Move = W,S,A,D \nLook,Aim = Mouse \nShoot = LClick \nPowerShot = Hold LClick \nUse = RClick \nDash = LShift");
	
	//only draw our client info
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		DrawGUI();
	}
}

function DrawGUI()
{
	if(GetComponent(BeehiveGUI).m_bShow)
		return;
		
		
	if(m_ViewMap)
	{
		var hives:GameObject[] = GameObject.FindGameObjectsWithTag("HivePedestals");
		var mouseOver:boolean = false;
		var iconSize = 32;// + Mathf.Sin(Time.time*4)*6;
		var iconBigSize = 32 + Mathf.Sin(Time.time*8)*6;
		for(var hive:GameObject in hives)
		{
			//if(hive.GetComponent(HiveScript).m_Owner == gameObject)
			//{
				var screenPos:Vector3 = Camera.main.WorldToScreenPoint(hive.transform.position);
				var rct:Rect = Rect(screenPos.x-iconSize*0.5,screenPos.y-iconSize*0.5, iconSize, iconSize);
				var hiveGroup:int = hive.GetComponent(PollenNetworkScript).m_Group;
				if(rct.Contains(Input.mousePosition))
				{
					m_FocusedGroupNum = hiveGroup;
					m_FocusedObject = hive;
					mouseOver = true;
				}
				//GUI.color = Color.yellow;
					// for(var edge:GameObject in hive.GetComponent(PollenNetworkScript).m_Edges)
					// {	
						// var edgePos:Vector3 = Camera.main.WorldToScreenPoint(edge.transform.position);
						// var diff:Vector3 = edgePos - screenPos ;
						// diff.z =0;
						// var ang:float = Mathf.Acos(Vector3.Dot(diff.normalized, Vector3.right));
						// if(diff.y > 0)
							// ang = -ang;
						// GUIUtility.RotateAroundPivot(ang*Mathf.Rad2Deg, Vector2(screenPos.x,Screen.height -screenPos.y));
						// GUI.DrawTexture(Rect(screenPos.x,Screen.height -screenPos.y-8, diff.magnitude, 16), NodeLineTexture);
						// GUIUtility.RotateAroundPivot(-ang*Mathf.Rad2Deg, Vector2(screenPos.x,Screen.height -screenPos.y));
							
					// }
				
				
				if(hive.GetComponent(PollenNetworkScript).m_Owner == gameObject)
				{
					hive.GetComponent(PollenNetworkScript).m_HasWorkerBee = true;
					GUI.color = Color.yellow;
				}	
				if(m_FocusedObject != null && m_FocusedObject.GetComponent(PollenNetworkScript).IsEdgeConnectionAllowed(hive))
					GUI.DrawTexture(Rect(screenPos.x-iconBigSize*0.5*1.5,Screen.height - screenPos.y-iconBigSize*0.5*1.5, iconBigSize*1.5, iconBigSize*1.5), HiveTexture);
				else
					GUI.DrawTexture(Rect(screenPos.x-iconSize*0.5*1.5,Screen.height - screenPos.y-iconSize*0.5*1.5, iconSize*1.5, iconSize*1.5), HiveTexture);
				GUI.color = Color.white;
			//}	
		}
	
		var flowers:GameObject[] = GameObject.FindGameObjectsWithTag("Flowers");
		for(var flower:GameObject in flowers)
		{
			var swarm:Transform = flower.transform.Find("Swarm"+flower.name);
			screenPos = Camera.main.WorldToScreenPoint(flower.transform.position);
			rct = Rect(screenPos.x-iconSize*0.5,screenPos.y-iconSize*0.5, iconSize, iconSize);
			var flowerGroup:int = flower.GetComponent(PollenNetworkScript).m_Group;
			if(rct.Contains(Input.mousePosition))
			{
				m_FocusedGroupNum = flowerGroup;
				m_FocusedObject = flower;
				mouseOver = true;
			}		
			
			GUI.color = Color.yellow;
			// for(var edge:GameObject in flower.GetComponent(PollenNetworkScript).m_Edges)
			// {
				// edgePos = Camera.main.WorldToScreenPoint(edge.transform.position);
				// diff= edgePos - screenPos ;
				// diff.z =0;
				// ang= Mathf.Acos(Vector3.Dot(diff.normalized, Vector3.right));
				// if(diff.y > 0)
					// ang = -ang;
				// GUIUtility.RotateAroundPivot(ang*Mathf.Rad2Deg, Vector2(screenPos.x,Screen.height -screenPos.y));
				// GUI.DrawTexture(Rect(screenPos.x,Screen.height -screenPos.y-8, diff.magnitude, 16), NodeLineTexture);
				// GUIUtility.RotateAroundPivot(-ang*Mathf.Rad2Deg, Vector2(screenPos.x,Screen.height -screenPos.y));
			// }
			GUI.color = Color.white;
			// if(swarm != null )
			// {
				// if(swarm.GetComponent(BeeParticleScript).m_Owner== gameObject)
				// {
							
					
					// if(m_FocusedObject!= null && (m_FocusedObject.GetComponent(PollenNetworkScript).IsEdgeConnectionAllowed(flower)
					// || m_FocusedGroupNum == flower.GetComponent(PollenNetworkScript).m_Group))
					// {
						
						// GUI.DrawTexture(Rect(screenPos.x-24,Screen.height - screenPos.y-24, 48, 48), NodeTexture);
					// }
					// else
						// GUI.DrawTexture(Rect(screenPos.x-16,Screen.height - screenPos.y-16, 32, 32), NodeTexture);
				// }
			// }
			// else
			//{
			//	Debug.Log("Here");
				//screenPos = Camera.main.WorldToScreenPoint(flower.transform.position);
				//Debug.Log(m_FocusedObject);
				if(flower.GetComponent(PollenNetworkScript).m_Owner == gameObject)
				{
					GUI.color = Color.yellow;
				}
				
				if(m_FocusedObject!= null && (m_FocusedGroupNum == flower.GetComponent(PollenNetworkScript).m_Group))
				{
					GUI.DrawTexture(Rect(screenPos.x-iconBigSize*0.5,Screen.height - screenPos.y-iconBigSize*0.5, iconBigSize, iconBigSize), NodeTexture);
				}
				else
				{
					GUI.DrawTexture(Rect(screenPos.x-iconSize*0.5,Screen.height - screenPos.y-iconSize*0.5, iconSize, iconSize), NodeTexture);
				}
				
				if(flower.GetComponent(PollenNetworkScript).m_Owner == gameObject)
				{
					//GUI.color = Color.yellow;
					if(flower.GetComponent(PollenNetworkScript).m_HasWorkerBee)
					{
					GUI.color = Color.white;
						GUI.DrawTexture(Rect(screenPos.x+Mathf.Sin(Time.time*Random.Range(8,16))*iconBigSize*0.250-iconBigSize*0.250,Screen.height - screenPos.y+Mathf.Sin(Time.time*Random.Range(8,16))*iconBigSize*0.250-iconBigSize*0.250, iconBigSize*0.5, iconBigSize*0.5), BeeTexture);
						GUI.color = Color.yellow;
						GUI.DrawTexture(Rect(screenPos.x-iconSize*0.75,Screen.height - screenPos.y-iconSize*0.75, iconSize*1.5, iconSize*1.5), CaptureRingTexture);
					}
				}
				GUI.color = Color.white;
			//}
			
		}
		
		if(mouseOver && Input.GetMouseButtonDown(0) && m_FocusedObject.GetComponent(PollenNetworkScript).m_Owner == gameObject
		   && m_FocusedObject.GetComponent(PollenNetworkScript).m_HasWorkerBee)
		{
			m_DraggedFocusObject = m_FocusedObject;
		}
		
		if(m_DraggedFocusObject != null)
		{
			GUI.DrawTexture(Rect(Input.mousePosition.x-16,Screen.height -Input.mousePosition.y-16, 32, 32), BeeTexture);
			// screenPos = Camera.main.WorldToScreenPoint(m_DraggedFocusObject.transform.position);
			// var diff:Vector3 = Input.mousePosition - screenPos;
			// diff.z =0;
			// var ang:float = Mathf.Acos(Vector3.Dot(diff.normalized, Vector3.right));
			// if(diff.y > 0)
				// ang = -ang;
		if(m_FocusedObject != null && !m_FocusedObject.GetComponent(PollenNetworkScript).m_HasWorkerBee)
					{
						var dist:Vector3 = m_FocusedObject.transform.position - m_DraggedFocusObject.transform.position;
						var scale :float = dist.magnitude/gameObject.Find("map").renderer.bounds.size.x;
						var cost : int = (scale * 5)+1;
						GUI.Label(Rect(Input.mousePosition.x,Screen.height-Input.mousePosition.y, 128, 32), "cost: "+cost);
						}
			// GUIUtility.RotateAroundPivot(ang*Mathf.Rad2Deg, Vector2(screenPos.x,Screen.height -screenPos.y-4));
			// GUI.depth = 9999;
			// GUI.DrawTexture(Rect(screenPos.x,Screen.height -screenPos.y-4, diff.magnitude, 8), HiveBarTexture);
			// GUI.depth = 1;
		}
		if(Input.GetMouseButtonUp(0))
		{
			if(mouseOver)
			{
				Debug.Log(m_DraggedFocusObject + " "+m_FocusedObject);
				if(m_DraggedFocusObject != null && m_DraggedFocusObject.GetComponent(PollenNetworkScript).m_Owner == gameObject)
				{
					Debug.Log("Edge added "+m_DraggedFocusObject.name +" to "+m_FocusedObject.name);
					if(!m_FocusedObject.GetComponent(PollenNetworkScript).m_HasWorkerBee)
					{
						// var dist:Vector3 = m_FocusedObject.transform.position - m_DraggedFocusObject.transform.position;
						// var scale :float = dist.magnitude/gameObject.Find("Map").renderer.bounds.size.x;
						// var cost : int = scale * 5;
						// GUI.Label(Rect(Input.mousePosition.x,Screen.height-Input.mousePosition.y, 128, 32), "cost: "+cost);
						//m_DraggedFocusObject.GetComponent(PollenNetworkScript).AddEdge(m_FocusedObject);
						if(m_FocusedObject.GetComponent(PollenNetworkScript).m_Owner == gameObject)
							m_FocusedObject.GetComponent(PollenNetworkScript).m_HasWorkerBee = true;
					}
				}
			}
			//if we were dragging
			//see if we have formed an edge
			
			
			m_DraggedFocusObject = null;
		}
		
		if(!mouseOver)
		{
			m_FocusedGroupNum =-1;
			m_FocusedObject = null;
		}
	}	
	else
	{
		//draw LifeBar
		// GUI.DrawTexture(Rect(30,Screen.height - 80, 253, 41), BarBGTexture, ScaleMode.ScaleToFit, true);
		// GUI.DrawTexture(Rect(83,Screen.height - 68, 180, 16), LifeBarTexture, ScaleMode.StretchToFill, true);
		// GUI.DrawTexture(Rect(30,Screen.height -80, 256, 32), LifeBarBGTexture, ScaleMode.ScaleToFit, true);
		//fXP = m_CurrXP;
		var health:int =GetComponent(BeeControllerScript).m_Stats["Health"];
		 for(var i = 0; i < 3+(health+1); i++)
		 {
			 GUI.DrawTexture(Rect(83+i*44, 68, 44, 32), m_LifeTextureContainer, ScaleMode.StretchToFill, true);
		 }
		for( i = 0; i < m_HP; i++)
		{
			GUI.DrawTexture(Rect(83+i*44, 68, 44, 32), m_LifeTexture, ScaleMode.StretchToFill, true);
		}

		
		//draw hive bar
		GUI.DrawTexture(Rect(90 ,118, 32, 32), BeeTexture, ScaleMode.StretchToFill, true);
		GUI.Label(Rect(135,118,256,48), m_WorkerBees+"/"+m_MaxWorkerBees,FontStyle);
		
			
		//draw the actual honey meter that shows the race for the crown
		for(i = 0; i < NetworkUtils.GetNumClients(); i++)
		{
			if(NetworkUtils.GetClientObject(i) == null)
				continue;
			var honeyPerc :float = NetworkUtils.GetClientObject(i).GetComponent(BeeScript).m_Honey;
			var fD:float = GameStateManager.m_PointsToWin;
			honeyPerc/= fD;
			honeyPerc = Mathf.Min(honeyPerc, 1);
			

			
			if(NetworkUtils.IsControlledGameObject(NetworkUtils.GetClientObject(i)))
			{
				m_HoneyInterpolator = Mathf.Lerp(m_HoneyInterpolator, honeyPerc, Time.deltaTime);
				//Debug.Log(NetworkUtils.GetClientObject(i).m_Name);
				GUI.DrawTexture(Rect(Screen.width - 306, 95, m_HoneyInterpolator*206, 24), HiveBarTexture, ScaleMode.StretchToFill, true);
				GUI.DrawTexture(Rect(Screen.width - 356,90, 256, 32), HiveBarBGTexture, ScaleMode.ScaleToFit, true);
				GUI.DrawTexture(Rect(Screen.width - 318+m_HoneyInterpolator*200, 70, 24, 24), BeeTexture, ScaleMode.ScaleToFit, true);
			}
			else
			{
				GUI.color = Color.black;
				GUI.DrawTexture(Rect(Screen.width - 318+honeyPerc*200, 70, 24, 24), BeeTexture, ScaleMode.ScaleToFit, true);
				GUI.color = Color.white;
			}
		}
		
		GUI.DrawTexture(Rect(Screen.width - 95, 78, 48, 48), CrownTexture, ScaleMode.ScaleToFit, true);

		//draw Inventory boxes
		GUI.DrawTexture(Rect(Screen.width - 100,Screen.height - 90, 86, 86), InventoryBoxTexture, ScaleMode.ScaleToFit, true);
		GUI.DrawTexture(Rect(Screen.width - 180,Screen.height - 90, 86, 86), InventoryBoxTexture, ScaleMode.ScaleToFit, true);
		
		if(m_Inventory[0].m_Img != null)
		{
			GUI.DrawTexture(Rect(Screen.width - 90,Screen.height - 80, 66, 66), m_Inventory[0].m_Img, ScaleMode.ScaleToFit, true);
		}
		if(m_Inventory[1].m_Img != null)
		{
			GUI.DrawTexture(Rect(Screen.width - 170,Screen.height - 80, 66, 66), m_Inventory[1].m_Img, ScaleMode.ScaleToFit, true);
		}
		
		//draw ammo amount and reload bar
		GUI.DrawTexture(Rect(Screen.width - 265, Screen.height - 60, 32,32), AmmoIconTexture, ScaleMode.ScaleToFit, true);
		var ammo : int = 0;
		if(GetComponentInChildren(ParticleEmitter) != null)
			ammo  = GetComponentInChildren(ParticleEmitter).particleCount;
		if(GetComponent(BeeControllerScript) != null && GetComponent(BeeControllerScript).m_ReloadTimer > 0)
			ammo = 0;
			
		GUI.Label(Rect(Screen.width - 235, Screen.height - 65, 132,132), (ammo < 10 ? "0" +ammo.ToString() : ammo.ToString()), FontStyle);
		var reloadSpeed :float = GetComponent(BeeControllerScript).m_Stats["Reload Speed"];
		var base : float = GetComponent(BeeControllerScript).m_LoadOut.m_BaseReloadSpeed;
		reloadSpeed = base -  ((reloadSpeed+1.0) /4.0)*base;
		var ReloadPerc : float = GetComponent(BeeControllerScript).m_ReloadTimer/reloadSpeed;
		
		//fast reload bar
		GUI.DrawTexture(Rect(Screen.width - 255, Screen.height - 20, 15,12), HiveBarTexture, ScaleMode.StretchToFill, true);
		//draw reload bar background
		GUI.DrawTexture(Rect(Screen.width - 275, Screen.height - 20, 90,12), ReloadBarTexture, ScaleMode.StretchToFill, true);
		//current reload percent
		GUI.DrawTexture(Rect(Screen.width - 275, Screen.height - 20, 90*(1-ReloadPerc),12), ReloadBarTexture, ScaleMode.StretchToFill, true);
		
		
		
		
		//draw money amount
		var money : String;
		if(m_Money < 100)
		 money += "0";
		if(m_Money < 10)
			money += "0";
		
		GUI.Label(Rect(Screen.width - 135, Screen.height - 135, 132,132), "$"+money+m_Money, FontStyle);
	}
}

function OnCollisionStay(coll : Collision) {

 if(coll.gameObject.tag == "Terrain")
		{
			for(var contact:ContactPoint in coll.contacts)
			{
				//transform.position += contact.normal*transform.localScale.magnitude;
				//GetComponent(UpdateScript).m_Vel -= contact.normal*Vector3.Dot(GetComponent(UpdateScript).m_Vel,contact.normal);
			}
			
			
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

	
	// if(Network.isServer)
	// {
		
		// if(hit.gameObject.tag == "Bullets" && gameObject.GetComponent(InvincibilityDecorator) == null)
		// {	Debug.Log("yowza");
			// if(GetComponent(BeeDashDecorator) != null)
			// {
				// hit.gameObject.GetComponent(UpdateScript).m_Vel = Vector3.Reflect(hit.gameObject.GetComponent(UpdateScript).m_Vel, GetComponent(UpdateScript).m_Vel.normalized);
				// networkView.RPC("DeflectBullet", RPCMode.All);
			// }
		// }
		// }
}

function OnCollisionEnter(coll : Collision) {

	//if we dash and hit an object we should shake the camera
	if(Network.isServer)
	{
	
		if(coll.gameObject.tag == "Bullets" && gameObject.GetComponent(InvincibilityDecorator) == null)
		{	
			if(GetComponent(BeeDashDecorator) != null)
			{
				coll.gameObject.GetComponent(UpdateScript).m_Vel = Vector3.Reflect(coll.gameObject.GetComponent(UpdateScript).m_Vel, GetComponent(UpdateScript).m_Vel.normalized);
				networkView.RPC("DeflectBullet", RPCMode.All);
			}
			else
			if(coll.gameObject.GetComponent(BulletScript).m_PowerShot )
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
					ServerRPC.Buffer(networkView,"KillBee", RPCMode.All, true);
					var pos:Vector3 = FindRespawnLocation();
					networkView.RPC("Respawn", RPCMode.All,pos);
				}
				else
					networkView.RPC("SetHP", RPCMode.All, m_HP - 3);
			}
			else
			{
				if(coll.gameObject.GetComponent(BulletScript).m_Owner != gameObject)
				{
					//we got hit by a bullet
					if(GetComponent(ItemDecorator) != null)
					{
						//drop item if we have it out
						ServerRPC.Buffer(networkView, "ThrowItem", RPCMode.All);
					}
					
					if(m_HP - 1 <= 0)
					{
						ServerRPC.Buffer(networkView, "KillBee", RPCMode.All, true);
						pos = FindRespawnLocation();
						networkView.RPC("Respawn", RPCMode.All,pos);
					}
					else
						networkView.RPC("SetHP", RPCMode.All, m_HP - 1);
				}
			}
		}
		else if(coll.gameObject.tag == "Terrain")
		{
			for(var contact:ContactPoint in coll.contacts)
			{
				//GetComponent(UpdateScript).m_Vel -= contact.normal*Vector3.Dot(GetComponent(UpdateScript).m_Vel,contact.normal);
			}
			
			
		}
		else if(coll.gameObject.tag == "Bears")
		{
			
			//networkView.RPC("Respawn", RPCMode.All);
			
		}
		else if(coll.gameObject.tag == "Rocks")
		{
			//if(coll.gameObject.GetComponent(RockScript).m_Owner != null &&
			 //coll.gameObject.GetComponent(RockScript).m_Owner != gameObject)
			
		}
		else if(coll.gameObject.tag == "Hammer" && coll.gameObject.GetComponent(HammerScript).m_Owner != gameObject)
		{
			networkView.RPC("SetHP", RPCMode.All, 0);
		}
	}
	
	
	if(GetComponent(BeeDashDecorator) != null && (coll.gameObject.tag == "Rocks" ||
		coll.gameObject.tag == "Trees"))
	{
		// Destroy(GetComponent(BeeDashDecorator));
		// Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
		// GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
		// GetComponent(UpdateScript).m_Vel = -GetComponent(UpdateScript).m_Vel * 0.2;
		// gameObject.AddComponent(ControlDisablerDecorator);
		// GetComponent(ControlDisablerDecorator).SetLifetime(0.25);
		
		
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
			networkView.RPC("SetHP", RPCMode.All, m_HP - 1);
		}
		
		else if(other.gameObject.tag == "Explosion" )
		{
			networkView.RPC("KillBee", RPCMode.All, true);
			var pos:Vector3 = FindRespawnLocation();
			networkView.RPC("Respawn", RPCMode.All,pos);
		}
	}
}

function OnNetworkInstantiate (info : NetworkMessageInfo) 
{
    Debug.Log("New " +gameObject.name+ " instantiated");
}

function FindRespawnLocation() : Vector3
{
		var locs:GameObject[] = gameObject.FindGameObjectsWithTag("Respawn");
		var index:int = Random.Range(0, locs.length-1);
		var pos:Vector3 = locs[index].transform.position;
		pos.y = 350;
		return pos;
}

function KillAndRespawn(splat:boolean)
{
	ServerRPC.Buffer(networkView, "KillBee", RPCMode.All, splat);
	var pos:Vector3 = FindRespawnLocation();
	ServerRPC.Buffer(networkView,"Respawn", RPCMode.All,pos);
}

@RPC function KillBee(splat:boolean)
{	
     m_HP = 0;
	//play death effect
	if(splat)
	{
		var gb : GameObject = gameObject.Instantiate(m_HitEffect);
		gb.transform.position = transform.position;
		gb.transform.localScale = Vector3(10.1, 10.1, 10.1);
		var ps : ParticleSystem = gb.GetComponent(ParticleSystem) as ParticleSystem;
		gb.renderer.material.SetColor("_TintColor", renderer.material.color);
		ps.startSize = 16;

		ps = gb.transform.Find("GrenadeInnerExplosion").GetComponent(ParticleSystem) as ParticleSystem;
		ps.gameObject.renderer.material.SetColor("_TintColor", renderer.material.color);
		ps.startSize = 10;
		ps = gb.transform.Find("GrenadeRing").GetComponent(ParticleSystem) as ParticleSystem;
		//ps.gameObject.renderer.material.SetColor("_TintColor", renderer.material.color);
		ps.startSize = 30;
		
		var go : GameObject = gameObject.Instantiate(m_DeathEffect);
		go.transform.position = transform.position;
		go.renderer.material.color = renderer.material.color;
		
		var splatter:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/Splatter", GameObject));
		splatter.transform.position = GetComponent(TerrainCollisionScript).m_TerrainInfo.point + Vector3.up*01;
		splatter.transform.rotation = Quaternion.AngleAxis(Random.Range(0, 360), Vector3.up);
		splatter.renderer.material.color = renderer.material.color;
		
		Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
	}
	
	if(GetComponent(ItemDecorator) != null)
	{
		//gameObject.Destroy(GetComponent(ItemDecorator).GetItem());
		GetComponent(ItemDecorator).ThrowItem();
	}
	
	var comps:Component[] = gameObject.GetComponents(Component);
	for (var comp:Component in comps)
	{
		Debug.Log(comp.ToString());
		if(comp.ToString().Contains("decorator") || comp.ToString().Contains("Decorator"))
		{
			DestroyImmediate(comp);
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
	Debug.Log("Respawning");
	// var gb : GameObject = gameObject.Instantiate(m_HitEffect);
	// gb.transform.position = transform.position;
	// gb.transform.localScale = Vector3(10.1, 10.1, 10.1);
	// var ps : ParticleSystem = gb.GetComponent(ParticleSystem) as ParticleSystem;
	// gb.renderer.material.SetColor("_TintColor", renderer.material.color);
	// ps.startSize = 16;

	// ps = gb.transform.Find("GrenadeInnerExplosion").GetComponent(ParticleSystem) as ParticleSystem;
	// ps.gameObject.renderer.material.SetColor("_TintColor", renderer.material.color);
	// ps.startSize = 10;
	// ps = gb.transform.Find("GrenadeRing").GetComponent(ParticleSystem) as ParticleSystem;
	// //ps.gameObject.renderer.material.SetColor("_TintColor", renderer.material.color);
	// ps.startSize = 30;
	
	// var go : GameObject = gameObject.Instantiate(m_DeathEffect);
	// go.transform.position = transform.position;
	// go.renderer.material.color = renderer.material.color;
	
	// var splatter:GameObject = gameObject.Instantiate(Resources.Load("GameObjects/Splatter", GameObject));
	// splatter.transform.position = GetComponent(TerrainCollisionScript).m_TerrainInfo.point + Vector3.up*01;
	// splatter.transform.rotation = Quaternion.AngleAxis(Random.Range(0, 360), Vector3.up);
	// splatter.renderer.material.color = renderer.material.color;
	
	if(GetComponent(InvincibilityDecorator) != null)
		gameObject.DestroyImmediate(gameObject.GetComponent(InvincibilityDecorator));
	if(GetComponent(DizzyDecorator) != null)
		gameObject.Destroy(gameObject.GetComponent(DizzyDecorator));
	
	if(GetComponent(ItemDecorator) != null)
	{
		//gameObject.Destroy(GetComponent(ItemDecorator).GetItem());
		GetComponent(ItemDecorator).ThrowItem();
		Destroy(GetComponent(ItemDecorator));
	}
	
	
	
	gameObject.AddComponent(RespawnDecorator);
	GetComponent(RespawnDecorator).SetLifetime(3);
	GetComponent(RespawnDecorator).m_RespawnPos = pos;
}

@RPC function SetHP(hp:int)
{
	//we are still alive
	if(hp < m_HP && hp > 0)
	{
		//add invincibility decorator
		gameObject.AddComponent(InvincibilityDecorator);
		gameObject.GetComponent(InvincibilityDecorator).m_Blink = false;
		//gameObject.AddComponent(FlasherDecorator);
		//gameObject.GetComponent(FlasherDecorator).m_Color = Color.red;
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
	var maxBees:int = GetComponent(BeeControllerScript).m_Stats["Max Workers"];
	maxBees = m_MaxWorkerBees + maxBees+1;
	if(maxBees > m_WorkerBees)
		m_WorkerBees++;
}

@RPC function AddWorkerBee(tgt : String,  offset : Vector3)
{
	var flowerDec :FlowerDecorator = GetComponent(FlowerDecorator);
	if(flowerDec != null)
	{
		m_WorkerBees--;
		flowerDec.m_FlashTimer = 1;
		flowerDec.Reset();
		
		
		
		var flowerComp:FlowerScript = gameObject.Find(tgt).GetComponent(FlowerScript);
		//the sanity check for this going value going above max happens in the flower decorator which fires this RPC
		flowerComp.m_NumBees++;
		flowerComp.m_HP += flowerComp.m_BaseHP;
		flowerComp.m_Owner = gameObject;
		if(flowerComp.m_NumBees >= flowerComp.m_MaxBees)
		{
			flowerDec.m_ProgressEffect.active = false;
		}
		
		
		if(NetworkUtils.IsControlledGameObject(gameObject))
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
		}
		
		
				
		//see if flower is part of a group
		if(flowerDec.GetFlower().transform.parent != null)
		{
			var group:FlowerGroupScript = flowerDec.GetFlower().transform.parent.GetComponent(FlowerGroupScript);
			var level:int = group.CheckForLevelup(flowerDec.GetFlower());
		
			if(level == 0)
			{
	
	
			}
			else
			if(level == 1)
			{
				if(NetworkUtils.IsControlledGameObject(gameObject))
				{
					var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/EventText"));
					txt.GetComponent(GUIText).text = "Group Bonus!";
				}
				group.Flash();
			}
			else
			{
				if(NetworkUtils.IsControlledGameObject(gameObject))
				{	
					txt  = gameObject.Instantiate(Resources.Load("GameObjects/EventText"));
					txt.GetComponent(GUIText).text = "+ "+level+" Group Production";
				}
				group.Flash();
			}
		}
	
		
		//flowerDec.GetFlower().GetComponent(PollenNetworkScript).m_Owner = gameObject;
		flowerDec.GetFlower().animation.Play("Flower");
		AudioSource.PlayClipAtPoint(flowerComp.m_BuildComplete, transform.position);
	}
	
	var go : GameObject = gameObject.Instantiate(m_WorkerBeeInstance);
	go.GetComponent(WorkerBeeScript).m_Owner = gameObject;
	go.renderer.material.color= renderer.material.color;
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
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		Camera.main.GetComponent(CameraScript).Shake(0.25, 0.5);
	}
} 


@RPC function AddSwarm(tgt : String,  offset : Vector3, numBees : int)
{
	var go : GameObject = gameObject.Instantiate(m_SwarmInstance);
	
	go.GetComponent(BeeParticleScript).m_Owner = gameObject;
	go.renderer.material.color= renderer.material.color;
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
		//go.renderer.material.SetColor("_TintColor", renderer.material.color);
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

@RPC function RemoveComponent(compName:String)
{
	DestroyImmediate(GetComponent(compName));
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
		
		if(NetworkUtils.IsControlledGameObject(gameObject))
		{
			var txt : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/KudosText"));
			txt.GetComponent(KudosTextScript).m_WorldPos = hive.transform.position+Vector3.up*20;
			txt.GetComponent(UpdateScript).m_Lifetime = 2;
			txt.GetComponent(GUIText).text = "+ $"+m_PollenCount*10;
			txt.GetComponent(GUIText).material.color = Color.yellow;
			var myPos:Vector3 = gameObject.transform.position;
			myPos.y = 0;
			var camPos:Vector3 = Camera.main.transform.position;
			camPos.y = 0;
			//Camera.main.GetComponent(CameraScript).m_CamPos +=  (myPos-camPos) - Camera.main.GetComponent(CameraScript).m_Offset;
		}
		m_PollenCount = 0;
	}
} 

@RPC function Drown(offset:Vector3)
{
	gameObject.AddComponent(DrowningDecorator);		
	transform.position -= offset;
}

@RPC function CreateHive(pos:Vector3)
{
	Debug.Log("Hive created");
	var go : GameObject = gameObject.Instantiate(Resources.Load("GameObjects/Hive"));
	go.name = go.name+gameObject.name;
	go.renderer.material.color = renderer.material.color;
	go.transform.position = pos; 
	go.transform.localScale *= 20;
	go.GetComponent(HiveScript).m_Owner = gameObject;
	go.GetComponent(HiveScript).m_Pedestal = GetComponent(PedestalDecorator).m_Pedestal;
	GetComponent(PedestalDecorator).m_Pedestal.GetComponent(PollenNetworkScript).m_Owner = gameObject;
	
	GetComponent(PedestalDecorator).m_HiveCreated = true;
	AudioSource.PlayClipAtPoint(GetComponent(PedestalDecorator).m_Pedestal.GetComponent(HivePedestalScript).m_BuildComplete, transform.position);
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		//AudioSource.PlayClipAtPoint(m_Pedestal.GetComponent(HivePedestalScript).m_StopwatchDing, transform.position);
	}
}
