#pragma strict

// static var MOVE_LEFT : int = 1;
// static var MOVE_RIGHT : int = 2;
// static var MOVE_UP : int = 4;
// static var MOVE_BACK : int = 8;
// static var SHOOT_DOWN : int = 16;
// static var SHOOT_UP : int = 32;
// static var USE : int = 64;
// static var DASH : int = 128;
// var m_CurrentActions : int = 0;

private var m_MovementKeyPressed : boolean = false;
private var m_MovementSpeed : float = 240;
private var m_ShootButtonHeld : boolean = false;
private var m_ShootButtonTimeHeld : float = 0.0;
private var m_DashButtonHeld : boolean = false;
private var m_DashButtonTimeHeld : float = 0.0;
private static var m_RTBRequiredHoldTime = 0.5;	//return to base required time
private static var m_PowerShotRequiredHoldTime = 0.5;
var m_ThirdPerson:boolean;

var m_DashSound : AudioClip = null;
var m_ShootSound : AudioClip = null;
var m_StartReloadSound : AudioClip  = null;
var m_ReloadSound : AudioClip  = null;
var m_PickupSound : AudioClip = null;
var m_ThrowSound : AudioClip  = null;
var m_HideSound : AudioClip = null;
var m_PowerShotEffectSound : AudioClip = null;
var m_PowerShotSound : AudioClip = null;


var m_ControlEnabled : boolean = true;
var m_MoveEnabled : boolean = true;
var m_LookEnabled : boolean = true;
var m_AttackEnabled : boolean = true;


var m_BulletInstance : GameObject = null; 
var m_PowerBulletInstance : GameObject = null; 
var m_PowerShotParticlesInstance : GameObject = null;

var m_Drag : float = 1; 

var m_FireRate : float = 5;
var m_FireTimer : float  = 0;
var m_ReloadTime : float = 1;
var m_ReloadTimer : float = 0;
var m_WorkerGenTime : float = 1;	//how often we generate a new worker
var m_WorkerGenTimer : float = 0;
var m_DashTimer : float = 0;
//var m_ClipSize : int = 30;
var m_LoadOut : LoadOut;

var m_ReloadJam: boolean = false;
var m_Stats = {"Loadout":-1, "Clip Size":-1, "Special Rounds":-1, "Powershot":-1, "Health":-1, "Speed":1, "Stamina":-1, "Reload Speed":-1,  "Fire Rate" : -1, "Max Workers":-1, "Worker Generation":-1 };



var m_NearestObject : GameObject = null;


function SetShootButtonTimeHeld( time : float )
{
	m_ShootButtonTimeHeld = time;
}


function Start () {

	m_FireTimer = 0;
	//AudioSource.PlayClipAtPoint(m_FlySound, Camera.main.transform.position, 0.75);
	
	m_LoadOut.CreateLoadOut(m_Stats["Loadout"]);
	
}

function Update()
{

	m_LoadOut.CreateLoadOut(m_Stats["Loadout"]);
	if(m_FireTimer > 0)
		m_FireTimer -= Time.deltaTime;
	if(m_ReloadTimer > 0)
	{
		m_ReloadTimer -= Time.deltaTime;
		if(m_ReloadTimer <= 0)
		{
			m_ReloadJam = false;
			GetComponentInChildren(ParticleRenderer).enabled = true;
			var clip:int = m_Stats["Clip Size"];
			GetComponentInChildren(BeeParticleScript).SetNumParticles(m_LoadOut.m_BaseClipSize + (clip+1) * m_LoadOut.m_BaseClipSize);
		}
	}
	
	if(m_WorkerGenTimer > 0)
	{
		m_WorkerGenTimer -= Time.deltaTime;
		if(m_WorkerGenTimer <= 0)
		{
			m_WorkerGenTimer = m_WorkerGenTime;
			networkView.RPC("GenerateWorkerBee", RPCMode.All);
		}
	}
	
	if(m_DashTimer > 0)
		m_DashTimer -= Time.deltaTime;
}

function OnNetworkInput(IN : InputState)
{
	if(!networkView.isMine)
	{
		return;
	}

	
	var Updater : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
		Updater.m_Accel = Vector3(0,0,0);
	if(!m_MovementKeyPressed)
	{
		var currSpeed : float = Updater.m_Vel.magnitude;
		if(currSpeed - m_Drag* Time.deltaTime <= 0)
		{
			Updater.m_Vel = Vector3(0,0,0);
		}
		else
		{
			Updater.m_Vel -= GetComponent(UpdateScript).m_Vel.normalized * m_Drag * Time.deltaTime;
		}
	}
		
	if(!m_ControlEnabled)
	 return;
	
	m_MovementKeyPressed = false;
	var IsDashing : boolean = GetComponent(BeeDashDecorator) == null ? false : true;
	
	//handle essential strafe movements
	//we arent allowed to change direction if we hit the dash button though
	if(!IsDashing && m_MoveEnabled)
	{

		if(IN.GetAction(IN.MOVE_UP))
		{
			if(m_ThirdPerson)
				GetComponent(UpdateScript).m_Accel += transform.forward *m_MovementSpeed;
			else
				GetComponent(UpdateScript).m_Accel += Vector3.forward *m_MovementSpeed;
			m_MovementKeyPressed = true;
		}
		
		if(IN.GetAction(IN.MOVE_RIGHT))
		{
			if(m_ThirdPerson)
				GetComponent(UpdateScript).m_Accel += transform.right *m_MovementSpeed;
			else
				GetComponent(UpdateScript).m_Accel += Vector3.right *m_MovementSpeed;
			m_MovementKeyPressed = true;
		}
		
		if(IN.GetAction(IN.MOVE_BACK))
		{
			if(m_ThirdPerson)
				GetComponent(UpdateScript).m_Accel -= transform.forward *m_MovementSpeed;
			else
				GetComponent(UpdateScript).m_Accel -= Vector3.forward *m_MovementSpeed;
			m_MovementKeyPressed = true;
		}
		
		if(IN.GetAction(IN.MOVE_LEFT))
		{
			if(m_ThirdPerson)
				GetComponent(UpdateScript).m_Accel -= transform.right *m_MovementSpeed;
			else
				GetComponent(UpdateScript).m_Accel -= Vector3.right *m_MovementSpeed;
			m_MovementKeyPressed = true;
		}
	}	
	//handle dash button
	if(IN.GetAction(IN.DASH) && GetComponent(TreeHideDecorator) == null)
	{
		if(m_MovementKeyPressed )
		{	
			if(!IsDashing && m_DashTimer <= 0)
			{
				var stam:float = m_Stats["Stamina"];
				var dashTime : float = 1.0 + (stam+1.0)*0.35;
				m_DashTimer = 1/dashTime;
				networkView.RPC("Dash", RPCMode.All);
			}
		}
		else
		{
			if(!IsDashing && GetComponent(ItemDecorator) == null)
			{
				m_DashButtonHeld = true;
			    if( m_DashButtonTimeHeld < m_RTBRequiredHoldTime && 
				   m_DashButtonTimeHeld + Time.deltaTime >= m_RTBRequiredHoldTime)
				{
					networkView.RPC("ReturnToBase", RPCMode.All);
				}
				m_DashButtonTimeHeld += Time.deltaTime;
			}
		}
	}
	else
	{
		m_DashButtonTimeHeld = 0;
	}
	

	
	//handle mouse look at
	
	// if(Input.GetKey(KeyCode.LeftArrow))
	// {
		// transform.eulerAngles.y -= 360 * Time.deltaTime;
	// }
	// if(Input.GetKey(KeyCode.RightArrow))
	// {
		// transform.eulerAngles.y += 360 * Time.deltaTime;
	// }
	
	
	//handle shooting actions
	if(IN.GetAction(IN.SHOOT) && m_AttackEnabled)
	{
		if(m_ReloadTimer <= 0 && GetComponent(FlowerDecorator) == null)
		{
			m_ShootButtonHeld = true;
			if(GetComponentInChildren(BeeParticleScript) != null &&
			   m_ShootButtonTimeHeld < m_PowerShotRequiredHoldTime && 
			   m_ShootButtonTimeHeld + Time.deltaTime >= m_PowerShotRequiredHoldTime)
			{
				if(GetComponentInChildren(ParticleEmitter).particles.length >= 5 && GetComponentInChildren(ParticleRenderer).enabled != false)
					networkView.RPC("AddPowerShotEffect", RPCMode.All);
			}
			m_ShootButtonTimeHeld += Time.deltaTime;
		}
	}
	if(IN.GetActionUpBuffered(IN.SHOOT) && m_AttackEnabled)
	{
		//Debug.Log("Shot up");
		//we are not allowed to shoot if we are on a flower
		//or if we have no swarm
		if(GetComponentInChildren(BeeParticleScript) != null)
		{
			//determine if this is a power shot or regular shot
			if(m_ShootButtonHeld && m_ShootButtonTimeHeld >= m_PowerShotRequiredHoldTime)
			{
				//powershot
				if(GetComponentInChildren(ParticleEmitter).particles.length >= 5 && GetComponentInChildren(ParticleRenderer).enabled != false)
				{
					var go : GameObject = Network.Instantiate(m_PowerBulletInstance, transform.position, Quaternion.identity, 0);
					networkView.RPC("PowerShot", RPCMode.All, go.name);
				}
			}
			else
			{
				//regular shot
				if(m_FireTimer <= 0 && m_ReloadTimer <= 0)
				{	
					var rate : float = m_Stats["Fire Rate"];
					var fireRate = m_LoadOut.m_BaseFireRate + (rate+1);
					m_FireTimer = 1/fireRate;//m_FireRate;
					HandleShotLogic();
				}
			}
		}
		m_ShootButtonHeld = false;
		m_ShootButtonTimeHeld = 0;
	}
	
	
	
	//handle use action
	if(IN.GetActionBuffered(IN.USE) && !m_ShootButtonHeld)
	{
		var beeScript = GetComponent(BeeScript);
		if(m_NearestObject != null)
		{
			//handle rocks
			if(m_NearestObject.tag == "Rocks" &&
			  m_NearestObject.GetComponent(BoxCollider) != null)
			{
				//make sure we arent already carrying something
				if(GetComponent(ItemDecorator) == null &&
				   m_NearestObject.GetComponent(ObjectRespawnDecorator) == null)
				{
					ServerRPC.Buffer(networkView, "PickupRock", RPCMode.All, m_NearestObject.name);
				}
			}
			else
			if(m_NearestObject.tag == "Trees")
			{
				//make sure we arent already carrying something
				if(GetComponent(ItemDecorator) == null)
				{
					networkView.RPC("HideInTree", RPCMode.All, m_NearestObject.name);
				}
			}
			else
			//handle flowers, dont bother doing anythign though if we do not have bees yet
			if(m_NearestObject.tag == "Flowers")
			{
				
				if(GetComponent(ItemDecorator) == null)
				{						
					//if(m_NearestObject.GetComponentInChildren(BeeParticleScript) == null)
					//{
						ServerRPC.Buffer(networkView, "UseFlower", RPCMode.All, m_NearestObject.name);
					//}
					
				}
				
			}
			else
			//handle hive pedestals
			if(m_NearestObject.tag == "HivePedestals")
			{
			    if(GetComponent(ItemDecorator) == null && !m_NearestObject.GetComponent(HivePedestalScript).m_Activated)
			    {
				 	ServerRPC.Buffer(networkView,"UsePedestal", RPCMode.All, m_NearestObject.name);
			    }
			}
			else
			//handle hives
			if(m_NearestObject.tag == "Hives")
			{
				   if(GetComponent(ItemDecorator) == null && m_NearestObject.GetComponent(HiveScript).m_Owner == gameObject)
				   {
						networkView.RPC("ShowHiveGUI", RPCMode.All, 1, m_NearestObject.name);
				   }
			}
			//handle hive pedestals
			if(m_NearestObject.tag == "Teleporters")
			{
			    if(GetComponent(ItemDecorator) == null && GetComponent(TeleportDecorator) == null)
			    {
				 	ServerRPC.Buffer(networkView,"UseTeleporter", RPCMode.All, m_NearestObject.name);
			    }
			}
		}
		else
		if(GetComponent(TreeHideDecorator) == null)
		{
			if(beeScript.m_Inventory[1].m_Item != null && GetComponent(ItemDecorator) == null)
			{
				var viewID : NetworkViewID= Network.AllocateViewID();
				go = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate(beeScript.m_Inventory[1].m_Item.name,"", Vector3(0,0,0), Quaternion.identity, viewID ,  0);
				ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, beeScript.m_Inventory[1].m_Item.name,go.name, Vector3(0,0,0), Quaternion.identity, viewID, 0);
				ServerRPC.Buffer(go.networkView, "ActivateItem", RPCMode.All, gameObject.name);	
				ServerRPC.Buffer(networkView, "UseItem", RPCMode.All, 1);	
			}
			else
			if(beeScript.m_Inventory[0].m_Item != null && GetComponent(ItemDecorator) == null)
			{
				viewID = Network.AllocateViewID();
				go = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate(beeScript.m_Inventory[0].m_Item.name,"", Vector3(0,0,0), Quaternion.identity, viewID ,  0);
				ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, beeScript.m_Inventory[0].m_Item.name,go.name, Vector3(0,0,0), Quaternion.identity, viewID, 0);
				ServerRPC.Buffer(go.networkView, "ActivateItem", RPCMode.All, gameObject.name);	
				ServerRPC.Buffer(networkView, "UseItem", RPCMode.All, 0);	
			}
		}
	}
	
	if(IN.GetActionBuffered(IN.RELOAD) && !m_ShootButtonHeld)
	{
		if(GetComponent(TreeHideDecorator) == null)
		{	
			if(GetComponent(ItemDecorator) == null && m_ReloadTimer <= 0)
			{
				networkView.RPC("Reload", RPCMode.All);
			}
			else if(m_ReloadTimer > 0)
			{
				networkView.RPC("QuickReload", RPCMode.All);
				
			}
		}
	}
	
}

function HandleShotLogic()
{	
	for(var i : int = 0; i < m_LoadOut.m_Pylons.length; i++)
	{
		if(m_LoadOut.m_Pylons[i].PosOffset != Vector3(0,0,0))
		{
			var bulletPos : Vector3 = transform.right * m_LoadOut.m_Pylons[i].PosOffset.x + transform.up * m_LoadOut.m_Pylons[i].PosOffset.y + transform.forward * m_LoadOut.m_Pylons[i].PosOffset.z + transform.position;
			var rot : Quaternion = Quaternion.AngleAxis(m_LoadOut.m_Pylons[i].AngOffset, Vector3.up);
			var bulletVel : Vector3 =  rot * transform.forward;// - (transform.right * halfSpread) + (i * 4) * transform.right;
			bulletVel.Normalize();
			bulletPos.y = transform.position.y;
			var go : GameObject  = Network.Instantiate(m_BulletInstance, bulletPos , Quaternion.identity, 0);	
			networkView.RPC("Shot", RPCMode.All, go.name, bulletPos, bulletVel * go.GetComponent(UpdateScript).m_MaxSpeed);
		}
	}
}

function OnPlayerLookAt(at : Vector3)
{
	if(m_LookEnabled)
	{
		transform.LookAt(transform.position+at);
	}
}

@RPC function QuickReload()
{
	var reload:float = m_Stats["Reload Speed"];
	reload = m_LoadOut.m_BaseReloadSpeed -  ((reload+1.0) /4.0)*m_LoadOut.m_BaseReloadSpeed;
	
	if(!m_ReloadJam && 1-m_ReloadTimer/reload >= 0.22 && 1-m_ReloadTimer/reload<= 0.38)
	{
		m_ReloadTimer = 0;
		GetComponentInChildren(ParticleRenderer).enabled = true;
		var clip:int = m_Stats["Clip Size"];
		GetComponentInChildren(BeeParticleScript).SetNumParticles(m_LoadOut.m_BaseClipSize + (clip+1) * m_LoadOut.m_BaseClipSize);
		if((Network.isServer && gameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject() == gameObject) ||
		Network.isClient && gameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject() == gameObject)
		{
			AudioSource.PlayClipAtPoint(m_ReloadSound, transform.position);
		}
	}
	else
	{
		m_ReloadJam = true;
	}
}

@RPC function Reload()
{
	m_ReloadTimer = m_Stats["Reload Speed"];
	m_ReloadTimer = m_LoadOut.m_BaseReloadSpeed -  ((m_ReloadTimer+1.0) /4.0)*m_LoadOut.m_BaseReloadSpeed;
	GetComponentInChildren(ParticleRenderer).enabled = false;
	if((Network.isServer && gameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject() == gameObject) ||
		Network.isClient && gameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject() == gameObject)
	{
		AudioSource.PlayClipAtPoint(m_StartReloadSound, transform.position);
	}
}

@RPC function Dash()
{
	gameObject.AddComponent(BeeDashDecorator);
	
}

@RPC function Shot(bulletName : String, pos : Vector3, vel : Vector3)
{
	AudioSource.PlayClipAtPoint(m_ShootSound, Camera.main.transform.position);
	var go : GameObject = gameObject.Find(bulletName);
	go.GetComponent(BulletScript).m_Owner = gameObject;
	Camera.main.GetComponent(CameraScript).Shake(0.35,0.25);
	go.GetComponent(BulletScript).m_PowerShot = false;
	go.GetComponent(BulletScript).m_BulletType = m_Stats["Special Rounds"];
	//make it so we dont collide with our own bullets
	Physics.IgnoreCollision(go.collider, collider);
	//GetComponent(UpdateScript).m_Accel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*0.25;
	//GetComponent(UpdateScript).m_Vel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*0.25;
	//set the position and velocity of the bullet
	go.transform.position = pos;
	go.GetComponent(UpdateScript).m_Vel = vel; 
	go.transform.LookAt(pos+vel);
	go.transform.localEulerAngles.y += 45;
	
	//go.transform.localScale.x = 0.3;
	//go.transform.localScale.z = 0.3;
	go.GetComponent(TrailRenderer).startWidth = go.transform.localScale.x;
	go.GetComponent(TrailRenderer).material.SetColor("_Emission", renderer.material.color);
	if(GetComponentInChildren(ParticleEmitter).particleCount == 1)
	{
		m_ReloadTimer = m_Stats["Reload Speed"];
		m_ReloadTimer = m_LoadOut.m_BaseReloadSpeed -  ((m_ReloadTimer+1.0) /4.0)*m_LoadOut.m_BaseReloadSpeed;
	}
	GetComponentInChildren(BeeParticleScript).RemoveParticle();
    go.renderer.material.SetColor("_TintColor", renderer.material.color);
}


@RPC function AddPowerShotEffect()
{
	var powerShot : GameObject = gameObject.Instantiate(m_PowerShotParticlesInstance);
	powerShot.transform.position = transform.position;
	powerShot.transform.parent = transform;
	
	audio.PlayClipAtPoint(m_PowerShotEffectSound, transform.position);
}

@RPC function PowerShot(bulletName : String)
{
	//m_PowerShotSound.Play();
	AudioSource.PlayClipAtPoint(m_PowerShotSound, Camera.main.transform.position);
	var go : GameObject = gameObject.Find(bulletName);
	go.GetComponent(BulletScript).m_Owner = gameObject;
	go.GetComponent(BulletScript).m_PowerShot = true;
	go.GetComponent(BulletScript).m_PowerShotType = m_Stats["Powershot"];
	//make it so we dont collide with our own bullets
	Physics.IgnoreCollision(go.collider, collider);
	
	//set the position and velocity of the bullet
	go.transform.localScale.x = 10;
	go.transform.localScale.y = 10;
	go.transform.localScale.z = 15;
	go.transform.position = transform.position+transform.forward*15;
	
	go.GetComponent(TrailRenderer).material.SetColor("_Emission", renderer.material.color);
	go.GetComponent(TrailRenderer).startWidth = 0.6* 10;
	go.GetComponent(TrailRenderer).time *= 2;
	go.GetComponent(UpdateScript).m_Vel = transform.forward * go.GetComponent(UpdateScript).m_MaxSpeed;
	
	var trgt : Transform = transform.Find("PowerShotParticleSystem(Clone)");
	if(trgt != null)
		Destroy(trgt.gameObject);
	gameObject.AddComponent(ControlDisablerDecorator);
	GetComponent(ControlDisablerDecorator).SetLifetime(0.25);
	GetComponent(UpdateScript).m_Accel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*4;
	GetComponent(UpdateScript).m_Vel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*4;
	
	for(var i = 0; i < 5; i++)
	{
		GetComponentInChildren(BeeParticleScript).RemoveParticle();
	}
	
	//time to relaod
	if(GetComponentInChildren(ParticleRenderer).enabled == false)
	{
		m_ReloadTimer = m_Stats["Reload Speed"];
		m_ReloadTimer = m_LoadOut.m_BaseReloadSpeed -  ((m_ReloadTimer+1.0) /4.0)*m_LoadOut.m_BaseReloadSpeed;
		
	}
	
	go.renderer.material.SetColor("_TintColor", renderer.material.color);
	go.GetComponent(TrailRenderer).material.SetColor("_TintColor", renderer.material.color);
}

@RPC function ReturnToBase()
{
	Debug.Log("Returning To Base");
	var hives:GameObject[] = GameObject.FindGameObjectsWithTag("Hives");
	var dist:float = 99999;
	var closestHive:GameObject = null;
	for(var hive:GameObject in hives)
	{
		if((transform.position - hive.transform.position).magnitude < dist && hive.GetComponent(HiveScript).m_Owner == gameObject)
		{
			dist = (transform.position - hive.transform.position).magnitude;
			closestHive = hive;
		}
	}
	
	if(closestHive != null)
	{
		gameObject.AddComponent(TeleportDecorator);
		GetComponent(TeleportDecorator).SetLifetime(3);
		GetComponent(TeleportDecorator).m_TelePos = closestHive.transform.position + Vector3.up*350;
	}
	else
	{
		
	}
}


@RPC function UseItem(index : int)
{
	GetComponent(BeeScript).m_Inventory[index].m_Item = null;
	GetComponent(BeeScript).m_Inventory[index].m_Img = null;
}

@RPC function PickupRock(rockName : String)
{	
	AudioSource.PlayClipAtPoint(m_PickupSound, Camera.main.transform.position);
	var rock : GameObject = GameObject.Find(rockName);
	gameObject.AddComponent(ItemDecorator);
	GetComponent(ItemDecorator).SetItem(rock, Vector3(0,1,14), Vector3(0,0,0), false, false);
	GetComponent(ItemDecorator).m_MaxSpeed = 25;
}

@RPC function UseFlower(name : String)
{
	if(gameObject.GetComponent(FlowerDecorator) == null)
	{
		AudioSource.PlayClipAtPoint(m_PickupSound, Camera.main.transform.position);
		gameObject.AddComponent(FlowerDecorator);
		var flower:GameObject = gameObject.Find(name);
		if(flower != null)
		{
			flower.GetComponent(FlowerScript).m_Owner = gameObject;
			GetComponent(FlowerDecorator).SetFlower(flower);
		}
	}
}

@RPC function UsePedestal(name : String)
{
	
	GameObject.Find(name).GetComponent(HivePedestalScript).Activate();
	
	if(gameObject.GetComponent(PedestalDecorator) == null)
	{
	Debug.Log("Adding ped dec");
		AudioSource.PlayClipAtPoint(m_PickupSound, Camera.main.transform.position);
		gameObject.AddComponent(PedestalDecorator);
		GetComponent(PedestalDecorator).SetPedestal(GameObject.Find(name));
	}
}

@RPC function HideInTree(tree : String)
{
	gameObject.AddComponent(TreeHideDecorator);
	GetComponent(TreeHideDecorator).Hide(gameObject.Find(tree));
}

@RPC function UseTeleporter(teleporter : String)
{

	gameObject.AddComponent(TeleportDecorator);
	GetComponent(TeleportDecorator).SetLifetime(3);
	GetComponent(TeleportDecorator).m_TelePos = GameObject.Find(teleporter).GetComponent(TeleporterScript).m_ExitTeleporter.transform.position + Vector3.up*350;
}

@RPC function ShowHiveGUI(bShow : int, hiveName : String)
{	
	var parts : GameObject  = gameObject.Instantiate(Resources.Load("GameObjects/BeeDashParticles"));
	parts.GetComponent(ParticleSystem).renderer.material.color = Color.white;
	parts.transform.position = transform.position;
	if(bShow == 1)
	{
		GetComponent(BeehiveGUI).Show(true, hiveName);
	}
	else
	{
		GetComponent(BeehiveGUI).Show(false, hiveName);
	}
	
	
}

function IsShootButtonHeld() : boolean
{
	return m_ShootButtonHeld;
}

function GetShootButtonTimeHeld() : float
{
    return m_ShootButtonTimeHeld;
}

function GetPowerShotRequiredHoldTime() : float
{
	return m_PowerShotRequiredHoldTime;
}





