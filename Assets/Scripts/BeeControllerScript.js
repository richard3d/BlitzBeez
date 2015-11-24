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
var m_TerrainMask:LayerMask;
private var m_MovementKeyPressed : boolean = false;
private var m_MovementSpeed : float = 240;
var m_ShootButtonHeld : boolean = false;
var m_ShootButtonTimeHeld : float = 0.0;
var m_AimTarget:GameObject = null;
var m_AimOffset:float = 0;
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
var m_TargetSound : AudioClip = null;
var m_DenialSound : AudioClip = null;

var m_ControlEnabled : boolean = true;
var m_MoveEnabled : boolean = true;
var m_LookEnabled : boolean = true;
var m_AttackEnabled : boolean = true;
var m_Heading :float = 0;

var m_BulletInstance : GameObject = null; 
var m_PowerBulletInstance : GameObject[] = null; 
var m_PowerShotParticlesInstance : GameObject = null;

var m_Drag : float = 1; 

var m_FireRate : float = 5;
var m_FireTimer : float  = 0;
var m_ReloadTime : float = 1;
var m_ReloadTimer : float = 0;
var m_PowershotReloadTimer : float = 0;
var m_WorkerGenTime : float = 5;	//how often we generate a new worker
var m_WorkerGenTimer : float = 0;
var m_DashTimer : float = 0;
var m_StaminaTimer : float = 0;
var m_NumDashes : int = 3;
//var m_ClipSize : int = 30;
var m_LoadOut : LoadOut;

var m_ReloadJam: boolean = false;
var m_Stats = {"Loadout":-1, "Clip_Size":-1, "Special_Rounds":-1, "Powershot":-1, "Health":-1, "Speed":1, "Stamina":-1, "Reload_Speed":-1,"Powershot_Reload":-1,  "Fire_Rate" : -1, "Pollination_Time":-1, "Max_Workers":-1, "Worker_Generation":-1 };


private var m_Swarm:GameObject = null;
var m_NearestObject : GameObject = null;


function SetShootButtonTimeHeld( time : float )
{
	m_ShootButtonTimeHeld = time;
}


function Start () {

	m_FireTimer = 0;
	//AudioSource.PlayClipAtPoint(m_FlySound, Camera.main.transform.position, 0.75);
	m_WorkerGenTimer = m_WorkerGenTime;
	m_LoadOut.CreateLoadOut(m_Stats["Loadout"]);
	var clip:int = m_Stats["Clip_Size"];
	m_Swarm = GameObject.Find("Swarm"+gameObject.name);
	//m_Swarm.GetComponent(BeeParticleScript).SetNumParticles(m_LoadOut.m_BaseClipSize + (clip+1) * m_LoadOut.m_BaseClipSize);
	
}

function Update()
{

	HandleShotLogic();
	if(m_FireTimer > 0)
		m_FireTimer -= Time.deltaTime;
	if(m_ReloadTimer > 0)
	{
		m_ReloadTimer -= Time.deltaTime;
		if(m_ReloadTimer <= 0)
		{
			m_ReloadJam = false;
			if(GetComponentInChildren(ParticleRenderer) != null)
				GetComponentInChildren(ParticleRenderer).enabled = true;
			// GetComponentInChildren(ParticleRenderer).animation["BeeSwarmReload"].time = GetComponentInChildren(ParticleRenderer).animation["BeeSwarmReload"].length;
			// GetComponentInChildren(ParticleRenderer).animation["BeeSwarmReload"].speed = -1;
			// GetComponentInChildren(ParticleRenderer).animation.Play("BeeSwarmReload");
			//GetComponentInChildren(ParticleRenderer).animation.Play();
			var clip:int = m_Stats["Clip_Size"];
			if(m_Swarm.active)
				m_Swarm.GetComponent(BeeParticleScript).SetNumParticles(m_LoadOut.m_BaseClipSize + (clip+1) * m_LoadOut.m_BaseClipSize);
		}
	}
	
	if(m_PowershotReloadTimer > 0)
	{
		m_PowershotReloadTimer -= Time.deltaTime;
		if(m_PowershotReloadTimer <= 0)
		{
			// m_ReloadJam = false;
			// if(GetComponentInChildren(ParticleRenderer) != null)
				// GetComponentInChildren(ParticleRenderer).enabled = true;
			// // GetComponentInChildren(ParticleRenderer).animation["BeeSwarmReload"].time = GetComponentInChildren(ParticleRenderer).animation["BeeSwarmReload"].length;
			// // GetComponentInChildren(ParticleRenderer).animation["BeeSwarmReload"].speed = -1;
			// // GetComponentInChildren(ParticleRenderer).animation.Play("BeeSwarmReload");
			// //GetComponentInChildren(ParticleRenderer).animation.Play();
			// var clip:int = m_Stats["Clip_Size"];
			// GetComponentInChildren(BeeParticleScript).SetNumParticles(m_LoadOut.m_BaseClipSize + (clip+1) * m_LoadOut.m_BaseClipSize);
		}
	}
	
	var maxWorkers:int = m_Stats["Max_Workers"];
	maxWorkers+=1;
	if(	m_WorkerGenTimer > 0 && 
		GetComponent(BeeScript).m_WorkerBees == 0 )
	{
		m_WorkerGenTimer -= Time.deltaTime;
		if(m_WorkerGenTimer <= 0)
		{
			if(Network.isServer)
				networkView.RPC("GenerateWorkerBee", RPCMode.All);
		}
	}
	
//	if(m_DashTimer > 0)
//		m_DashTimer -= Time.deltaTime;
	
	if(m_StaminaTimer > 0)
	{
		m_StaminaTimer -= Time.deltaTime;
		if(m_StaminaTimer <= 0)
		{
			StaminaRecharge();
		}
	}
}

function StaminaRecharge()
{
	var recharge:float = 0.33;
	
	while(recharge > 0)
	{
		if(m_StaminaTimer > 0)
			return;
		recharge -= 0.015;
		yield WaitForSeconds(0.015);
		
		if(recharge <= 0 && m_NumDashes < 3)
		{
			recharge = 0.33;
			m_NumDashes++;
		}
	}
	
}

function OnNetworkInput(IN : InputState)
{
	if(!networkView.isMine || GetComponent(ControlDisablerDecorator) != null)
	{
		return;
	}

	
	var Updater : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	
	if(!m_MovementKeyPressed)
	{
		Updater.m_Accel = Vector3(0,Updater.m_Accel.y,0);
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
				Updater.m_Accel += transform.forward *m_MovementSpeed*IN.m_YAxisVal;
			else
				Updater.m_Accel += Vector3.forward *m_MovementSpeed*IN.m_YAxisVal;
			m_MovementKeyPressed = true;
		}
		
		if(IN.GetAction(IN.MOVE_RIGHT))
		{
			if(m_ThirdPerson)
				Updater.m_Accel += transform.right *m_MovementSpeed*IN.m_XAxisVal;
			else
				Updater.m_Accel += Vector3.right *m_MovementSpeed*IN.m_XAxisVal;
			m_MovementKeyPressed = true;
		}
		
		if(IN.GetAction(IN.MOVE_BACK))
		{
			if(m_ThirdPerson)
				Updater.m_Accel += transform.forward *m_MovementSpeed*IN.m_YAxisVal;
			else
				Updater.m_Accel += Vector3.forward *m_MovementSpeed*IN.m_YAxisVal;
			m_MovementKeyPressed = true;
		}
		
		if(IN.GetAction(IN.MOVE_LEFT))
		{
			if(m_ThirdPerson)
				Updater.m_Accel += transform.right *m_MovementSpeed*IN.m_XAxisVal;
			else
				Updater.m_Accel += Vector3.right *m_MovementSpeed*IN.m_XAxisVal;
			m_MovementKeyPressed = true;
		}
		//TODO: Tiltling for strafing	
		transform.GetChild(0).localEulerAngles.z = Mathf.LerpAngle(transform.GetChild(0).localEulerAngles.z,-35*IN.m_XAxisVal, Time.deltaTime*4);//*IN.m_XAxisVal;
	}	
	//handle dash button
	if(IN.GetActionBuffered(IN.DASH) && GetComponent(TreeHideDecorator) == null)
	{
		if(m_MovementKeyPressed )
		{	
			if(!IsDashing && m_DashTimer <= 0 && m_NumDashes > 0)
			{
				var stam:float = m_Stats["Stamina"];
				var dashTime : float = 2;
				
				
				m_StaminaTimer = 1/(0.5 + (stam+1.0)*0.35);
				//m_DashTimer = 1/dashTime;
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
	

	//handle shooting actions
	if(IN.GetAction(IN.SHOOT) && m_AttackEnabled)
	{
		if(/*m_ReloadTimer <= 0 && */m_PowershotReloadTimer <= 0 && GetComponent(FlowerDecorator) == null && GetComponent(PedestalDecorator) == null )
		{
		
			m_ShootButtonHeld = true;
			if(GetComponentInChildren(BeeParticleScript) != null &&
			   m_ShootButtonTimeHeld < m_PowerShotRequiredHoldTime && 
			   m_ShootButtonTimeHeld + Time.deltaTime >= m_PowerShotRequiredHoldTime)
			{
				//if(GetComponentInChildren(ParticleEmitter).particles.length >= 5 && GetComponentInChildren(ParticleRenderer).enabled != false)
					networkView.RPC("AddPowerShotEffect", RPCMode.All);
			}
			m_ShootButtonTimeHeld += Time.deltaTime;
		}
	}
	
	if(IN.GetActionUpBuffered(IN.SHOOT) && m_AttackEnabled)
	{
		//we are not allowed to shoot if we are on a flower
		//or if we have no swarm
		if(GetComponentInChildren(BeeParticleScript) != null)
		{
			//determine if this is a power shot or regular shot
			if(m_ShootButtonHeld && m_ShootButtonTimeHeld >= m_PowerShotRequiredHoldTime && m_PowershotReloadTimer <= 0)
			{
				//powershot
				//if(GetComponentInChildren(ParticleEmitter).particles.length >= 5 && GetComponentInChildren(ParticleRenderer).enabled != false)
				//{
				var powerShot:int = m_Stats["Powershot"];
				if(powerShot == 4)
				{
					networkView.RPC("PowerShot", RPCMode.All, "null");
				
				}
				else
				{
					//var go : GameObject = Network.Instantiate(m_PowerBulletInstance[powerShot+1], transform.position, transform.rotation, 0);
					var go : GameObject = BulletScript.SpawnBullet(m_PowerBulletInstance[powerShot+1], transform.position, Vector3.zero);
					networkView.RPC("PowerShot", RPCMode.All, go.name);
				}
			//	}
			}
			else
			{
				//regular shot
				if(m_FireTimer <= 0 && m_ReloadTimer <= 0)
				{	
					var rate : float = m_Stats["Fire_Rate"];
					var fireRate = m_LoadOut.m_BaseFireRate + (rate+1);
					m_FireTimer = -1;///fireRate;//m_FireRate;
				//	HandleShotLogic();
					var shot:boolean = false;
					for(var p : int = 0; p < m_LoadOut.m_Pylons.length; p++)
					{
						if(m_LoadOut.m_Pylons[p].CanShoot())
						{
							shot = true;
						}
					}
					if(shot)
					{
						networkView.RPC("DecrementAmmo", RPCMode.All);
					}
				}
			}
		}
		m_ShootButtonHeld = false;
		m_ShootButtonTimeHeld = 0;
	}
	
	//handle upgrade action
	if(IN.GetActionBuffered(IN.DPAD_RIGHT) && !m_ShootButtonHeld)
	{
		var beeScript = GetComponent(BeeScript);
		if( beeScript.m_NumUpgradesAvailable > 0 && GetComponent(TreeHideDecorator) == null)
		{
			//handle upgrade
			var six:int[] = new int[6];
			var removedTalents:Array = new Array();
			var validIndices:Array = new Array();
			for(var i:int = 0; i < GetComponent(TalentTree).m_Talents.Count; i++)
			{
				validIndices.Add(i);
			}
			for(i = 0; i < 6; i++)
			{
				var indexSel:int = Random.Range(0,validIndices.Count-1);
				six[i] = validIndices[indexSel];
				validIndices.RemoveAt(indexSel);
				//removedTalents.Add(GetComponent(TalentTree).m_Talents[six[i]]);
				//GetComponent(TalentTree).m_Talents.RemoveAt(six[i]);
			}
			
			
			networkView.RPC("EnterHive", RPCMode.All, six[0], six[1], six[2], six[3], six[4], six[5]);
		}
	}
	
	//handle use action
	if(IN.GetActionBuffered(IN.USE) && !m_ShootButtonHeld)
	{
		beeScript = GetComponent(BeeScript);
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
				if(GetComponent(ItemDecorator) == null && GetComponent(TreeHideDecorator) == null)
				{
					HideInTree(m_NearestObject.name);
					networkView.RPC("HideInTree", RPCMode.Others, m_NearestObject.name);
				}
			}
			else
			//handle flowers, dont bother doing anythign though if we do not have bees yet
			if(m_NearestObject.tag == "Flowers")
			{
				
				if(GetComponent(ItemDecorator) == null /*&& beeScript.m_WorkerBees > 0*/ &&
					m_NearestObject.GetComponent(FlowerScript).m_Occupied == false)
				{						
					//if(m_NearestObject.GetComponentInChildren(BeeParticleScript) == null)
					//{
					if(m_NearestObject.GetComponent(FlowerScript).m_Owner != null && 
					   m_NearestObject.GetComponent(FlowerScript).m_Owner != gameObject)
						return;
						
						ServerRPC.Buffer(networkView, "UseFlower", RPCMode.All, m_NearestObject.name);
					//}
				}
				else
				{
					networkView.RPC("DenyFlower", RPCMode.All);
				}
				
			}
			// else
			// //handle hive pedestals
			// if(m_NearestObject.tag == "HivePedestals")
			// {
			    // if(GetComponent(ItemDecorator) == null && !m_NearestObject.GetComponent(HivePedestalScript).m_Activated)
			    // {
				 	// ServerRPC.Buffer(networkView,"UsePedestal", RPCMode.All, m_NearestObject.name);
			    // }
			// }
			else
			//handle teleporter
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
				go = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate(beeScript.m_Inventory[1].m_Item.name,"", transform.position, Quaternion.identity, viewID ,  0);
				ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, beeScript.m_Inventory[1].m_Item.name,go.name, transform.position, Quaternion.identity, viewID, 0);
				ServerRPC.Buffer(go.networkView, "ActivateItem", RPCMode.All, gameObject.name);	
				ServerRPC.Buffer(networkView, "UseItem", RPCMode.All, 1);	
			}
			else
			if(beeScript.m_Inventory[0].m_Item != null && GetComponent(ItemDecorator) == null)
			{
				viewID = Network.AllocateViewID();
				go = GameObject.Find("GameServer").GetComponent(ServerScript).NetworkInstantiate(beeScript.m_Inventory[0].m_Item.name,"", transform.position, Quaternion.identity, viewID ,  0);
				ServerRPC.Buffer(GameObject.Find("GameServer").GetComponent(ServerScript).m_GameplayMsgsView, "NetworkInstantiate", RPCMode.Others, beeScript.m_Inventory[0].m_Item.name,go.name, transform.position, Quaternion.identity, viewID, 0);
				ServerRPC.Buffer(go.networkView, "ActivateItem", RPCMode.All, gameObject.name);	
				ServerRPC.Buffer(networkView, "UseItem", RPCMode.All, 0);	
			}
			else
			{
				//Perform targeting by scanning for enemy players
				var players:GameObject[] = GameObject.FindGameObjectsWithTag("Player");
				var closestDot = 99999;
				var found:boolean = false;
				for(i = 0; i < players.length; i++)
				{
					if(players[i] != gameObject && players[i].GetComponent(BeeScript).m_Team != beeScript.m_Team && GetComponent(ItemDecorator) == null)
					{
						if(Physics.Linecast(transform.position, players[i].transform.position, m_TerrainMask))
							continue;
						if(players[i].GetComponent(RespawnDecorator) != null)
							continue;
						var dot:float = Vector3.Angle(transform.forward.normalized, (players[i].transform.position - transform.position));
						if(dot < 45 && dot < closestDot)
						{
							closestDot = dot;
							m_AimTarget = players[i];
							found = true;
						}
					}
				}
				//play target sound
				if(found)
				{
					AudioSource.PlayClipAtPoint(m_TargetSound, transform.position);
				}
				
			}
			
		}
	}
	

	
	//handle aiming
	if(IN.GetAction(IN.USE))
	{
		if(m_AimTarget != null)
		{
			
			var ang:float = Vector3.Angle((m_AimTarget.transform.position - transform.position).normalized, transform.forward);
			if(Vector3.Dot((m_AimTarget.transform.position - transform.position).normalized, transform.right) < 0)
			{
				ang = -ang;
			}
			
			
			gameObject.transform.Rotate(ang*Vector3.up * Time.deltaTime*4+m_AimOffset*Vector3.up);
			//gameObject.transform.Rotate(m_AimOffset*0.5*Vector3.up);
		
			if(m_AimTarget.GetComponent(RespawnDecorator) != null)
			{
				m_AimTarget = null;
				m_Heading = transform.localEulerAngles.y;
			}
			
			// GetComponent(BeeScript).m_Camera.GetComponent(Camera).fov = Mathf.Lerp(GetComponent(BeeScript).m_Camera.GetComponent(Camera).fov, 16, Time.deltaTime *2);
			// GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).m_Pitch = 5;
		}
	
	}
	else
	{
		if(m_AimTarget != null)
		{
			m_AimTarget = null;
			m_Heading = transform.localEulerAngles.y;
			// GetComponent(BeeScript).m_Camera.GetComponent(Camera).fov = 33;
			// GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).m_Pitch = 10;
		}
	}
	
	if(IN.GetActionBuffered(IN.RELOAD) /*&& !m_ShootButtonHeld*/)
	{
		if(GetComponent(TreeHideDecorator) == null)
		{	
			if(GetComponent(ItemDecorator) == null && m_ReloadTimer <= 0)
			{
				networkView.RPC("Reload", RPCMode.All);
			}
			else if(m_ReloadTimer > 0)
			{
				var reload:float = m_Stats["Reload_Speed"];
				reload = m_LoadOut.m_BaseReloadSpeed -  ((reload+1.0) /4.0)*m_LoadOut.m_BaseReloadSpeed;
				if(!m_ReloadJam && 1-m_ReloadTimer/reload >= 0.22 && 1-m_ReloadTimer/reload<= 0.38)
				{
					networkView.RPC("QuickReload", RPCMode.All);
				}
				else
					networkView.RPC("ReloadJammed", RPCMode.All);
				
			}
		}
	}
	
}

function HandleShotLogic()
{	
	var random =Random.Range(-1,1);
	for(var i : int = 0; i < m_LoadOut.m_Pylons.length; i++)
	{
		if(m_LoadOut.m_Pylons[i].IsShooting())
		{
			var bulletPos : Vector3 = transform.right * m_LoadOut.m_Pylons[i].PosOffset.x + transform.up * m_LoadOut.m_Pylons[i].PosOffset.y + transform.forward * m_LoadOut.m_Pylons[i].PosOffset.z + transform.position;
			var rot : Quaternion = Quaternion.AngleAxis(m_LoadOut.m_Pylons[i].AngOffset+random, Vector3.up);
			var bulletVel : Vector3 =  rot * transform.forward;// - (transform.right * halfSpread) + (i * 4) * transform.right;
			var temp:Vector3 = bulletVel;
			//bulletVel =	Quaternion.AngleAxis(random ,Vector3.up)*transform.forward ;
			bulletVel.Normalize();
			
			var loadout = m_Stats["Loadout"];
			if(loadout == 4)
				bulletVel *= Random.Range(0.75,2);
			bulletPos.y = transform.position.y;
			
			
		
			var go : GameObject = null;
			go = BulletScript.SpawnBullet(m_LoadOut.m_Pylons[i].m_BulletInstance,bulletPos,Vector3.zero);
			Debug.Log("Spawning bullet "+m_LoadOut.m_Pylons[i].m_BulletInstance.name + " for "+gameObject.name); 
			//Uncomment this later if not using pool!!!
			// if(m_LoadOut.m_Pylons[i].m_BulletInstance != null)
				// go  = Network.Instantiate(m_LoadOut.m_Pylons[i].m_BulletInstance, bulletPos , Quaternion.identity, 0);	
			// else
				// go  = Network.Instantiate(m_BulletInstance, bulletPos , Quaternion.identity, 0);	
			
			
			//go.GetComponent(BulletScript).m_BulletType = m_Stats["Special_Rounds"];
			networkView.RPC("Shot", RPCMode.All, go.name, bulletPos, bulletVel * go.GetComponent(UpdateScript).m_MaxSpeed, true);
		}
	}
}

@RPC function Dash()
{
	m_NumDashes--;
	gameObject.AddComponent(BeeDashDecorator);
	
}

@RPC function DecrementAmmo()
{
	
	// if(GetComponentInChildren(ParticleEmitter).particleCount == 1)
	// {
		// m_ReloadTimer = m_Stats["Reload_Speed"];
		// m_ReloadTimer = m_LoadOut.m_BaseReloadSpeed -  ((m_ReloadTimer+1.0) /4.0)*m_LoadOut.m_BaseReloadSpeed;
	// }
	
	// if(NetworkUtils.IsLocalGameObject(gameObject))
	// {
		// GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).Shake(0.5, 0.5);
	// }
	// GetComponentInChildren(BeeParticleScript).RemoveParticle();
	
}

@RPC function Shot(bulletName : String, pos : Vector3, vel : Vector3, decrementAmmo:boolean)
{
	//transform.Find("Bee/NewBee").animation.Stop();
	transform.Find("Bee/NewBee").animation.Stop("flyandshoot");
	transform.Find("Bee/NewBee").animation["flyandshoot"].layer = 2;
	transform.Find("Bee/NewBee").animation["flyandshoot"].AddMixingTransform(transform.Find("Bee/NewBee/body/r_shoulder"));
	transform.Find("Bee/NewBee").animation.Play("flyandshoot");
	
	
	var go : GameObject = gameObject.Find(bulletName);
	go.GetComponent(BulletScript).m_Owner = gameObject;
	go.GetComponent(BulletScript).m_PowerShot = false;
	AudioSource.PlayClipAtPoint(go.GetComponent(BulletScript).m_SoundEffect, Camera.main.transform.position);
	
	//if(NetworkUtils.IsLocalGameObject(gameObject))
	//	GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).Shake(0.35,1);
	
	
	//make it so we dont collide with our own bullets
	if(go.collider.enabled && collider.enabled)
		Physics.IgnoreCollision(go.collider, collider);
	//GetComponent(UpdateScript).m_Accel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*0.25;
	//GetComponent(UpdateScript).m_Vel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*0.25;
	//set the position and velocity of the bullet
	go.transform.position = pos;
	go.GetComponent(UpdateScript).m_Vel = vel; 
	go.transform.LookAt(pos+vel);
//	go.transform.localEulerAngles.y += 45;
	
	//go.transform.localScale.x = 0.3;
	//go.transform.localScale.z = 0.3;
	var color = NetworkUtils.GetColor(gameObject);
	//Debug.Log(color);
	//if(go.GetComponent(TrailRenderer)
	if(go.GetComponent(TrailRenderer))
	{
	//go.GetComponent(TrailRenderer).startWidth = go.transform.localScale.x;
	
	go.GetComponent(TrailRenderer).material.color = color;
	go.GetComponent(TrailRenderer).material.SetColor("_Emission", color);
	}
	// gameObject.AddComponent(ControlDisablerDecorator);
	// GetComponent(ControlDisablerDecorator).SetLifetime(0.15);
	// GetComponent(UpdateScript).m_Accel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*0.35;
	// GetComponent(UpdateScript).m_Vel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*0.35;

    go.renderer.material.SetColor("_Color",color);
	go.renderer.material.SetColor("_Emission", color);
	go.GetComponent(BulletScript).Start();
	
}

function OnPlayerTurn(ang:float)
{
	if(m_LookEnabled)
	{
		if(m_AimTarget)
		{
			m_AimOffset = ang;
			//Debug.Log(m_AimOffset);
			//if(Vector3.Dot(at, transform.forward) < 0)
			//	m_AimOffset = -m_AimOffset;
		}
		else
		{
			// if(Vector3.Dot(at, transform.forward) < 0)
				// at = -at;
			// transform.LookAt(transform.position+at.normalized);	
			var Terr:TerrainCollisionScript = GetComponent(TerrainCollisionScript);	
		
			transform.up = Vector3.Lerp(transform.up,Terr.m_TerrainInfo.normal, Time.deltaTime*4);	
			m_Heading += ang;
			transform.Rotate(Vector3(0,m_Heading,0));
			 // if(Vector3.Dot(at, transform.forward) < 0)
				 // transform.Rotate(Vector3(0, - at.magnitude,0));
			 // else
			 // transform.Rotate(Vector3(0, at.magnitude,0));
			//
		}
	}
}

//this function is just responsible for making a quick reload request
@RPC function QuickReload()
{
	m_ReloadTimer = 0;
	GetComponentInChildren(ParticleRenderer).enabled = true;
	var clip:int = m_Stats["Clip_Size"];
	GetComponentInChildren(BeeParticleScript).SetNumParticles(m_LoadOut.m_BaseClipSize + (clip+1) * m_LoadOut.m_BaseClipSize);
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		AudioSource.PlayClipAtPoint(m_ReloadSound, transform.position);
	}
	

}


@RPC function ReloadJammed()
{
	m_ReloadJam = true;
	//Debug.Log("Jammed");
}

@RPC function Reload()
{
	//Debug.Log("Reload Standard");
	m_ReloadTimer = m_Stats["Reload_Speed"];
	m_ReloadTimer = m_LoadOut.m_BaseReloadSpeed -  ((m_ReloadTimer+1.0) /4.0)*m_LoadOut.m_BaseReloadSpeed;
	GetComponentInChildren(ParticleRenderer).enabled = false;
	//GetComponentInChildren(ParticleRenderer).animation.Play();
	if(NetworkUtils.IsControlledGameObject(gameObject))
	{
		
		AudioSource.PlayClipAtPoint(m_StartReloadSound, transform.position);
	}
}




@RPC function AddPowerShotEffect()
{
	var powershotType:int = m_Stats["Powershot"];
	
	var powerShot : GameObject = gameObject.Instantiate(m_PowerBulletInstance[powershotType+1].GetComponent(BulletScript).m_PowershotEffect);
	powerShot.name = "PowerShotEffect";
	powerShot.transform.position = transform.position;
	powerShot.transform.parent = transform;
	audio.PlayClipAtPoint(m_PowerShotEffectSound, transform.position);
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Stop();
	GameObject.Find(gameObject.name+"/Bee/NewBee").animation.Play("charge_powershot");
}

function PowershotAnim()
{
	var bee:GameObject = GameObject.Find(gameObject.name+"/Bee/NewBee");
	bee.animation.Stop();
	bee.animation.Play("powershot");
	
	while(bee.animation["powershot"].time < bee.animation["powershot"].length)
	{
		yield WaitForSeconds(1.0/30.0);
	}
	
	bee.animation.Stop("powershot");
	bee.animation.Play("fly");
}

@RPC function PowerShot(bulletName : String)
{
	var color = NetworkUtils.GetColor(gameObject);
	if(NetworkUtils.IsLocalGameObject(gameObject))
		GetComponent(BeeScript).m_Camera.GetComponent(CameraScript).Shake(0.25,3);
	AudioSource.PlayClipAtPoint(m_PowerShotSound, Camera.main.transform.position);
	PowershotAnim();
	
	if(bulletName != "null")
	{
		var go : GameObject = gameObject.Find(bulletName);
		go.GetComponent(BulletScript).m_Owner = gameObject;		
		
		//set the position and velocity of the bullet
		go.transform.position = transform.position+transform.forward*15;
		go.GetComponent(UpdateScript).m_Vel = transform.forward * go.GetComponent(UpdateScript).m_MaxSpeed;
		go.transform.LookAt(go.transform.position+go.GetComponent(UpdateScript).m_Vel);
		if(go.GetComponent(TrailRenderer) != null)
		{
			go.GetComponent(TrailRenderer).material.SetColor("_Emission", color);
			go.GetComponent(TrailRenderer).startWidth = 0.6* 10;
			go.GetComponent(TrailRenderer).time = 0.14;
			
			go.renderer.material.SetColor("_TintColor", color);
			go.GetComponent(TrailRenderer).material.SetColor("_TintColor", color);
		}
		
		go.GetComponent(BulletScript).Start();
		
	}
	else
	{
		if(Network.isServer)
		{
			m_Stats["Loadout"] = 8;
			m_Stats["Special_Rounds"] = 2;
			m_LoadOut.CreateLoadOut(m_Stats["Loadout"]);
			HandleShotLogic();
			m_Stats["Loadout"] = -1;
			m_Stats["Special_Rounds"] = -1;
			m_LoadOut.CreateLoadOut(m_Stats["Loadout"]);
		}
	}
	var trgt : Transform = transform.Find("PowerShotEffect");
	if(trgt != null)
		Destroy(trgt.gameObject);
	gameObject.AddComponent(ControlDisablerDecorator);
	GetComponent(ControlDisablerDecorator).SetLifetime(0.25);
	GetComponent(UpdateScript).m_Accel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*4;
	GetComponent(UpdateScript).m_Vel = -transform.forward * GetComponent(UpdateScript).m_MaxSpeed*4;
	
	for(var i = 0; i < 5; i++)
	{
		//GetComponentInChildren(BeeParticleScript).RemoveParticle();
	}
	
	//time to relaod
	if(GetComponentInChildren(ParticleRenderer).enabled == false)
	{
		
	//	m_ReloadTimer = m_Stats["Powershot_Reload"];
		//m_ReloadTimer = m_LoadOut.m_BaseReloadSpeed -  ((m_ReloadTimer+1.0) /4.0)*m_LoadOut.m_BaseReloadSpeed;
		
	}
	m_PowershotReloadTimer = m_Stats["Powershot_Reload"];
	m_PowershotReloadTimer = 1.5 -  ((m_PowershotReloadTimer+1.0) /4.0)*1.5;
	

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
		GetComponent(TeleportDecorator).m_ReturnToBase = true;
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
	GetComponent(ItemDecorator).m_MaxSpeed = 75;
}

@RPC function UseFlower(name : String)
{
	if(gameObject.GetComponent(FlowerDecorator) == null)
	{
		AudioSource.PlayClipAtPoint(m_PickupSound, Camera.main.transform.position);
		gameObject.AddComponent(FlowerDecorator);
		var pollinationTime:int = m_Stats["Pollination_Time"];
		gameObject.GetComponent(FlowerDecorator).SetLifetime(1-(pollinationTime+1)*0.5);
		var flower:GameObject = gameObject.Find(name);
		if(flower != null)
		{
			flower.GetComponent(FlowerScript).m_Occupied = true;
			GetComponent(FlowerDecorator).SetFlower(flower);
		}
	}
}

@RPC function DenyFlower()
{
	if(NetworkUtils.IsControlledGameObject(gameObject))
		AudioSource.PlayClipAtPoint(m_DenialSound, Camera.main.transform.position);
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
	if(GetComponent(TreeHideDecorator) == null)
	{
		Debug.Log("Hiding "+tree);
		gameObject.AddComponent(TreeHideDecorator);
		GetComponent(TreeHideDecorator).Hide(gameObject.Find(tree));
	}
}

@RPC function UnHideFromTree(vDisplacement : Vector3)
{
	if(GetComponent(TreeHideDecorator) != null)
	{
		Debug.Log("Unhiding "+GetComponent(TreeHideDecorator).m_Tree.name);
		GetComponent(TreeHideDecorator).m_DisplaceVector = vDisplacement;
		DestroyImmediate(GetComponent(TreeHideDecorator));
	}
}

@RPC function UseTeleporter(teleporter : String)
{
	gameObject.AddComponent(TeleportDecorator);
	GetComponent(TeleportDecorator).SetLifetime(0.25);
	GetComponent(TeleportDecorator).m_ReturnToBase = false;
	GetComponent(TeleportDecorator).m_TelePos = GameObject.Find(teleporter).GetComponent(TeleporterScript).m_ExitTeleporter.transform.position + Vector3.up*350;
	
	transform.position.x = GameObject.Find(teleporter).transform.position.x;
	transform.position.z = GameObject.Find(teleporter).transform.position.z;
	GetComponent(UpdateScript).m_Vel = Vector3.zero;
	GetComponent(UpdateScript).m_Accel = Vector3.zero;
	
	var m_TeleportEffect:GameObject= GameObject.Instantiate(Resources.Load("GameObjects/TeleporterParticles"),transform.position, Quaternion.identity);
	m_TeleportEffect.transform.eulerAngles = Vector3(270,0,0);
	AudioSource.PlayClipAtPoint(GameObject.Find(teleporter).GetComponent(TeleporterScript).m_TeleportSound, Camera.main.transform.position);
	//m_TeleportEffect = GameObject.Instantiate(Resources.Load("GameObjects/StrobeParticles"),GameObject.Find(teleporter).transform.position+Vector3.up*GameObject.Find(teleporter).transform.localScale.y*2,Quaternion.identity);
	//m_TeleportEffect.GetComponent(ParticleSystem).startSpeed = 90;
	//m_TeleportEffect.transform.position = GameObject.Find(teleporter).transform;
//	m_TeleportEffect.transform.parent = transform;
	//m_TeleportEffect.transform.position = GetComponent(TerrainCollisionScript).m_TerrainInfo.point + Vector3.up*0.1;
	
	
}
@RPC function EnterHive( item0:int, item1:int, item2:int, item3:int, item4:int, item5:int)
{
	GetComponent(BeehiveGUI).m_Selection[0] = item0;
	GetComponent(BeehiveGUI).m_Selection[1] = item1;
	GetComponent(BeehiveGUI).m_Selection[2] = item2;
	GetComponent(BeehiveGUI).m_Selection[3] = item3;
	GetComponent(BeehiveGUI).m_Selection[4] = item4;
	GetComponent(BeehiveGUI).m_Selection[5] = item5;
	ShowHiveGUI(1);
}

@RPC function ShowHiveGUI(bShow : int)
{	
	
	Debug.Log("SHOWING HIVE " +bShow);
	//if(GetComponent(BeeScript).m_CurrLevel > 0)
	//{
		if(bShow == 1)
		{
			//freeze our character and hide them
			gameObject.AddComponent(ControlDisablerDecorator);
			
			
			//if this bee is our controlled bee then show the hive GUI
			//if(NetworkUtils.IsControlledGameObject(gameObject))
			GetComponent(BeehiveGUI).Show(true);
			
			
						
			
			//GetComponent(NetworkInputScript).enabled = false;
			GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
			GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			//transform.position = gameObject.Find(hiveName).transform.position;
		}
		else
		{
			//if(NetworkUtils.IsControlledGameObject(gameObject))
			GetComponent(BeehiveGUI).Show(false);
			
		
		
			GetComponent(NetworkInputScript).enabled = true;
			Destroy(gameObject.GetComponent(ControlDisablerDecorator));
		}
	//}	
	
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





