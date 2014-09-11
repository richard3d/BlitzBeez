#pragma strict

class Inventory
{
	var m_Img : Texture2D = null;
	var m_Item : GameObject = null;	 
}

var m_SwarmInstance : GameObject = null;
var m_DeathEffect : GameObject = null;
var m_HitEffect : GameObject = null;
var m_DazeEffect : GameObject = null;
var m_HoneycombCount : int = 0; //how many honey comb items have we collected? when this number reaches 3 the honey comb item will spawn a hive for us

var m_CashInSound:AudioClip;

var m_Bounce : boolean = true;
var m_HP : int = 3;
var m_Money : int = 0;
var m_PollenCount:int = 0;
var m_Honey:int = 0;
var m_HoneyInterpolator:float = 0;
var m_CurrXP : int = 0;
var m_CurrLevel : int = 0;
var m_XPToLevel : int[];

var m_CurrSwmXP : float = 0;
var m_CurrSwmLevel : int = 0;
var m_XPToSwmLevel : int[];

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
var FontStyle : GUIStyle = null;

var m_Inventory : Inventory[];

function Awake()
{
	m_Inventory = new Inventory[2];
	m_Inventory[0] = new Inventory();
	m_Inventory[1] = new Inventory();
}

function Start () {

	m_XPToLevel  = [25,100,300,500,750];
	m_XPToSwmLevel  = [25,100,300,500,750];
	m_HoneycombCount = 0;
	m_Money = 0;
}

function Update () {
	rigidbody.velocity = Vector3(0,0,0);
	
	if(m_Bounce)
		transform.position.y = 6 + (Mathf.Sin(Time.time*26)+2)*0.5;
	else
		transform.position.y = 6;
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
	//draw LifeBar
	// GUI.DrawTexture(Rect(30,Screen.height - 80, 253, 41), BarBGTexture, ScaleMode.ScaleToFit, true);
	// GUI.DrawTexture(Rect(83,Screen.height - 68, 180, 16), LifeBarTexture, ScaleMode.StretchToFill, true);
	// GUI.DrawTexture(Rect(30,Screen.height -80, 256, 32), LifeBarBGTexture, ScaleMode.ScaleToFit, true);
	//fXP = m_CurrXP;
	var health:int =GetComponent(BeeControllerScript).m_Stats["Health"];
	 for(var i = 0; i < 3+health; i++)
	 {
		 GUI.DrawTexture(Rect(83+i*44, 68, 44, 32), m_LifeTextureContainer, ScaleMode.StretchToFill, true);
	 }
	for( i = 0; i < m_HP; i++)
	{
		GUI.DrawTexture(Rect(83+i*44, 68, 44, 32), m_LifeTexture, ScaleMode.StretchToFill, true);
	}

	
	//draw hive bar
//	GUI.DrawTexture(Rect(30,Screen.height - 40, 253, 41), BarBGTexture, ScaleMode.ScaleToFit, true);
    var pollenPerc:float  = (m_PollenCount % 3.0)/3;
	var pollenIndex : int = m_PollenCount/3;
	
	
	for(i =  0; i < pollenIndex; i++)
	{
		GUI.color = Color.Lerp(Color.white,Color(1,0.75,0,1), (Mathf.Sin(Time.time*16)+1)*0.5);
		//GUI.Color = Color.yellow;
		GUI.DrawTexture(Rect(90 + (i) *45 ,118, 38, 16), HiveBarTexture, ScaleMode.StretchToFill, true);		
	}
	GUI.color = Color.white;
	GUI.DrawTexture(Rect(90 + (i) *45 ,118, 38*pollenPerc, 16), HiveBarTexture, ScaleMode.StretchToFill, true);
	
	
	
	GUI.DrawTexture(Rect(90,118, 38, 16), PollenMeterTexture, ScaleMode.StretchToFill, true);
	GUI.DrawTexture(Rect(135,118, 38, 16), PollenMeterTexture, ScaleMode.StretchToFill, true);
	GUI.DrawTexture(Rect(180,118, 38, 16), PollenMeterTexture, ScaleMode.StretchToFill, true);
	
	
	
		
	//draw the actual honey meter that shows the race for the crown
	for(i = 0; i < NetworkUtils.GetNumClients(); i++)
	{
		if(NetworkUtils.GetClientObject(i) == null)
			continue;
		var honeyPerc :float = NetworkUtils.GetClientObject(i).GetComponent(BeeScript).m_Honey;
		var fD:float = GameStateManager.m_PointsToWin;
		honeyPerc/= fD;
		honeyPerc = Mathf.Min(honeyPerc, 1);
		

		m_HoneyInterpolator = Mathf.Lerp(m_HoneyInterpolator, honeyPerc, Time.deltaTime);
		if(NetworkUtils.IsControlledGameObject(NetworkUtils.GetClientObject(i)))
		{
			GUI.DrawTexture(Rect(Screen.width - 306, 95, m_HoneyInterpolator*256, 24), HiveBarTexture, ScaleMode.StretchToFill, true);
			GUI.DrawTexture(Rect(Screen.width - 356,90, 256, 32), HiveBarBGTexture, ScaleMode.ScaleToFit, true);
			GUI.DrawTexture(Rect(Screen.width - 318+m_HoneyInterpolator*256, 70, 24, 24), BeeTexture, ScaleMode.ScaleToFit, true);
		}
		else
		{
			GUI.DrawTexture(Rect(Screen.width - 318+honeyPerc*256, 70, 24, 24), BeeTexture, ScaleMode.ScaleToFit, true);
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

function OnCollisionEnter(coll : Collision) {

	//if we dash and hit an object we should shake the camera
	if(Network.isServer)
	{
		if(coll.gameObject.tag == "Bullets" && gameObject.GetComponent(InvincibilityDecorator) == null)
		{
			if(GetComponent(BeeDashDecorator) != null)
			{
				coll.gameObject.GetComponent(UpdateScript).m_Vel = Vector3.Reflect(coll.gameObject.GetComponent(UpdateScript).m_Vel, GetComponent(UpdateScript).m_Vel.normalized);
				gameObject.AddComponent(PauseDecorator);
				GetComponent(PauseDecorator).m_Lifetime = 0.25;
			}
			else
			if(coll.gameObject.transform.localScale.x > 5 )
			{
				//hit by a powershot 
				//we got hit by a bullet
				if(GetComponent(ItemDecorator) != null)
				{
					//drop item if we have it out
					ServerRPC.Buffer(networkView, "ThrowItem", RPCMode.All);
				}
				networkView.RPC("SetHP", RPCMode.All, m_HP - 3);
				
				
			}
			else
			{
				//we got hit by a bullet
				if(GetComponent(ItemDecorator) != null)
				{
					//drop item if we have it out
					ServerRPC.Buffer(networkView, "ThrowItem", RPCMode.All);
				}
				
				
				networkView.RPC("SetHP", RPCMode.All, m_HP - 1);
				
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
		else if(coll.gameObject.tag == "Explosion" && coll.gameObject.GetComponent(BombExplosionScript).m_Owner != gameObject)
		{
			
			networkView.RPC("SetHP", RPCMode.All, 0);
		}
		else if(coll.gameObject.tag == "Hammer" && coll.gameObject.GetComponent(HammerScript).m_Owner != gameObject)
		{
			networkView.RPC("SetHP", RPCMode.All, 0);
		}
	}
	
	
	if(GetComponent(BeeDashDecorator) != null && (coll.gameObject.tag == "Rocks" ||
		coll.gameObject.tag == "Trees"))
	{
		Destroy(GetComponent(BeeDashDecorator));
		Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
		GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
		GetComponent(UpdateScript).m_Vel = -GetComponent(UpdateScript).m_Vel * 0.2;
		gameObject.AddComponent(ControlDisablerDecorator);
		GetComponent(ControlDisablerDecorator).SetLifetime(0.25);
		
		//coll.gameObject.GetComponent(RockScript).Crack();
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

@RPC function Respawn(pos:Vector3)
{
	m_PollenCount = 0;
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
	
	if(GetComponent(DizzyDecorator) != null)
		gameObject.Destroy(gameObject.GetComponent(DizzyDecorator));
	
	if(GetComponent(ItemDecorator) != null)
	{
		//gameObject.Destroy(GetComponent(ItemDecorator).GetItem());
		GetComponent(ItemDecorator).ThrowItem();
	}
	
	Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
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
	if(go.tag == "Flowers")
	{
		if(go.GetComponentInChildren(ParticleEmitter) != null && go.GetComponentInChildren(ParticleEmitter).particleCount - numBees <= 0)
		{
			var deathEffect : GameObject = gameObject.Instantiate(m_DeathEffect);
			deathEffect.transform.position = go.transform.position + Vector3(0,12,0);
			deathEffect.renderer.material.color = renderer.material.color;
			
			go.GetComponent(FlowerScript).m_LifebarTimer = -1;
			for(var i:int = 0;  i < go.transform.childCount; i++)
			{
				Destroy(go.transform.GetChild(i).gameObject);
			}
			
		}
		else
			go.GetComponent(FlowerScript).m_LifebarTimer = 2;
		
	}
	else if(go.tag == "Player")
	{
		if(go.GetComponentInChildren(ParticleEmitter).particleCount - numBees <= 0)
			go.GetComponent(BeeControllerScript).m_ReloadTimer = go.GetComponent(BeeControllerScript).m_ReloadTime;
	}
	
	if(go.GetComponentInChildren(BeeParticleScript) != null)
	{
		for(i  = 0;i  < numBees; i++)
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
	GetComponent(PedestalDecorator).m_HiveCreated = true;
	AudioSource.PlayClipAtPoint(GetComponent(PedestalDecorator).m_Pedestal.GetComponent(HivePedestalScript).m_BuildComplete, transform.position);
	
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		//AudioSource.PlayClipAtPoint(m_Pedestal.GetComponent(HivePedestalScript).m_StopwatchDing, transform.position);
	}
}
