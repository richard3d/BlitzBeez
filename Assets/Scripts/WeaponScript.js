#pragma strict
var m_Owner : GameObject = null;
var m_MuzzleEffect : GameObject = null;
var m_AttachMuzzleEffect : boolean = true;
var m_SoundEffect : AudioClip = null;
var m_EffectPerRound : boolean = false;	//determines whether muzzle flash and sound effects should be generated for every bullet or just when the player pulls the trigger
var m_KickbackAmt : float = 0;
var m_KickbackRecoveryTime : float = 0;
var m_ClipSize : int = 0;
//@HideInInspector
var m_Ammo : int = 0;
var m_DecrementAmmoPerRound : boolean = false;	//Set this to true when a loadout shoots bursts like an assault rifle to have the ammo decrement for each round rather than each time the trigger is pulled
var m_ReloadTime : float = 0;

var m_ReloadTimer : float = 0;
var m_LoadOut : LoadOut;

var m_SpeedScalar : float = 1; //scalar for affecting speed, only happens during SetOwner()
var m_AccelScalar : float = 1; //scalar for affecting movement, only happens during SetOwner()
var m_DragScalar : float = 1;
function Start () {
	m_Ammo = m_ClipSize;
}

function SetOwner(owner:GameObject)
{
	m_Owner = owner;
	m_Owner.GetComponent(UpdateScript).m_DefaultMaxSpeed *= m_SpeedScalar;
	m_Owner.GetComponent(UpdateScript).m_MaxSpeed = m_Owner.GetComponent(UpdateScript).m_DefaultMaxSpeed;
	m_Owner.GetComponent(UpdateScript).m_MaxAccel *= m_AccelScalar;
	m_Owner.GetComponent(UpdateScript).m_Drag *= m_DragScalar;
}

function Update () {
}

function Fire()
{
	var shot:boolean = false;
	for(var p : int = 0; p < m_LoadOut.m_Pylons.length; p++)
	{
		if(m_LoadOut.m_Pylons[p].m_CanShoot)
		{
			DoPylonLogic(p);
			shot = true;
		}
	}
	
	if(shot)
	{
		GetComponent.<NetworkView>().RPC("Shot", RPCMode.All);
	}
}


function DoPylonLogic(i:int)
{

	m_LoadOut.m_Pylons[i].m_CanShoot = false;
	yield WaitForSeconds(m_LoadOut.m_Pylons[i].m_FireDelay);
	
	var fDelta:float = 0.033;
	m_LoadOut.m_Pylons[i].m_BurstNum = m_LoadOut.m_Pylons[i].m_BurstCount;
	
	while(m_LoadOut.m_Pylons[i].m_BurstNum > 0)
	{
		m_LoadOut.m_Pylons[i].m_FireRateTimer -= fDelta;
		if(m_LoadOut.m_Pylons[i].m_FireRateTimer <= 0)
		{
			m_LoadOut.m_Pylons[i].m_FireRateTimer = m_LoadOut.m_Pylons[i].m_FireRate;
			m_LoadOut.m_Pylons[i].m_BurstNum--;
			
			var random =Random.Range(-m_LoadOut.m_Pylons[i].AngRandomOffset,m_LoadOut.m_Pylons[i].AngRandomOffset);
			var bulletPos : Vector3 = m_Owner.transform.right * m_LoadOut.m_Pylons[i].PosOffset.x + m_Owner.transform.up * m_LoadOut.m_Pylons[i].PosOffset.y + m_Owner.transform.forward * m_LoadOut.m_Pylons[i].PosOffset.z + m_Owner.transform.position;
			var rot : Quaternion = Quaternion.AngleAxis(m_LoadOut.m_Pylons[i].AngOffset+random, Vector3.up);
			var bulletVel : Vector3 =  rot * m_Owner.transform.forward;
			var temp:Vector3 = bulletVel;
			bulletVel.Normalize();
			bulletPos.y = m_Owner.transform.position.y;
			
			var go : GameObject = null;
			go = BulletScript.SpawnBullet(m_LoadOut.m_Pylons[i].m_BulletInstance,bulletPos,Vector3.zero);
			GetComponent.<NetworkView>().RPC("InitRound", RPCMode.All, go.name, bulletPos, bulletVel * go.GetComponent(UpdateScript).m_MaxSpeed, true);
			
		}
		yield WaitForSeconds(fDelta);
	}
	yield WaitForSeconds(m_LoadOut.m_Pylons[i].m_FireTime);
	
	if(m_ReloadTimer <= 0)
		m_LoadOut.m_Pylons[i].m_CanShoot = true;
}

function Reload(bInstantaneous:boolean)
{
	if(bInstantaneous)
	{
		m_ReloadTimer = 0;
		for(var p:int = 0; p < m_LoadOut.m_Pylons.length; p++)
		{
			m_LoadOut.m_Pylons[p].m_CanShoot = true;
		}
		m_Ammo = m_ClipSize;
	}
	else
	{
		m_ReloadTimer = m_ReloadTime;
		var fDelta:float = 0.033;	
		
		for(p = 0; p < m_LoadOut.m_Pylons.length; p++)
		{
			m_LoadOut.m_Pylons[p].m_CanShoot = false;
		}

		while(m_ReloadTimer > 0)
		{
			m_ReloadTimer -= fDelta;
			yield WaitForSeconds(fDelta);
		}
			
		for(p = 0; p < m_LoadOut.m_Pylons.length; p++)
		{
			m_LoadOut.m_Pylons[p].m_CanShoot = true;
		}
		m_Ammo = m_ClipSize;
	}
	
	
}

@RPC function Shot()
{
	
	if(!m_DecrementAmmoPerRound)
	{
		m_Ammo--;
		if(m_Ammo <= 0)
			Reload(false);
	}
	
	var go : GameObject = gameObject.Instantiate(m_MuzzleEffect);
	var size:float = 1;

	var systems:Component[] = go.GetComponentsInChildren(ParticleSystem);
	for (var system:ParticleSystem in systems)
	{
		system.startSize *= 1.0;
		size = system.startSize;
	}
	
	if(m_Owner)
	{
		go.transform.position =  m_Owner.transform.position+ m_Owner.transform.forward *size;
		go.transform.LookAt(m_Owner.transform.position+ m_Owner.transform.forward *size*2);
		if(m_AttachMuzzleEffect)
			go.transform.parent = m_Owner.transform;
	}

	AudioSource.PlayClipAtPoint(m_SoundEffect, m_Owner.transform.position);
	
	//transform.Find("Bee/NewBee").animation.Stop();
	m_Owner.transform.Find("Bee/NewBee").GetComponent.<Animation>().Stop("flyandshoot");
	m_Owner.transform.Find("Bee/NewBee").GetComponent.<Animation>()["flyandshoot"].layer = 2;
	m_Owner.transform.Find("Bee/NewBee").GetComponent.<Animation>()["flyandshoot"].AddMixingTransform(m_Owner.transform.Find("Bee/NewBee/body/r_shoulder"));
	m_Owner.transform.Find("Bee/NewBee").GetComponent.<Animation>().Play("flyandshoot");
	
	//perform kick back
	if(m_KickbackRecoveryTime != 0)
	{
		m_Owner.AddComponent(ControlDisablerDecorator);
		m_Owner.GetComponent(ControlDisablerDecorator).SetLifetime(m_KickbackRecoveryTime);
		m_Owner.GetComponent(UpdateScript).m_Accel = -m_Owner.transform.forward * m_Owner.GetComponent(UpdateScript).m_MaxSpeed*m_KickbackAmt;
		m_Owner.GetComponent(UpdateScript).m_Vel = -m_Owner.transform.forward * m_Owner.GetComponent(UpdateScript).m_MaxSpeed*m_KickbackAmt;
	}
}


@RPC function InitRound(bulletName : String, pos : Vector3, vel : Vector3, decrementAmmo:boolean)
{
	if(m_DecrementAmmoPerRound)
	{
		m_Ammo--;
		if(m_Ammo <= 0)
			Reload(false);
	}
	if(m_EffectPerRound)
		AudioSource.PlayClipAtPoint(m_SoundEffect, m_Owner.transform.position);
	var go : GameObject = gameObject.Find(bulletName);
	//make it so we dont collide with our own bullets
	if(go.GetComponent.<Collider>().enabled && m_Owner.GetComponent.<Collider>().enabled)
		Physics.IgnoreCollision(go.GetComponent.<Collider>(), m_Owner.GetComponent.<Collider>());
				
	go.GetComponent(BulletScript).m_Owner = m_Owner;
	go.GetComponent(BulletScript).m_PowerShot = false;
	go.transform.position = pos;
	go.GetComponent(UpdateScript).m_Vel = vel; 
	go.transform.LookAt(pos+vel);
	
	var trailEffect:GameObject;
	if(go.GetComponent(BulletScript).m_TrailEffect != null)
	{
		trailEffect = gameObject.Instantiate(go.GetComponent(BulletScript).m_TrailEffect, go.transform.position, Quaternion.identity);
		trailEffect.transform.parent = go.transform;
	}
	
	var aimTgt:GameObject = m_Owner.GetComponent(BeeControllerScript).m_AimTarget;
	if(go.GetComponent(BulletScript).m_BulletType == BulletType.Rocket)
	{
		if(aimTgt != null)
		{
			//fifteen degrees is the most the player can be off by and still get some homing
			go.GetComponent(BulletScript).m_Homing = Mathf.Max(0,1-Vector3.Angle(m_Owner.transform.forward, (aimTgt.transform.position - m_Owner.transform.position).normalized)/15);
			Debug.Log("Homing "+go.GetComponent(BulletScript).m_Homing);
			go.GetComponent(BulletScript).m_Tgt = aimTgt;
			//Debug.Log("Homing "+go.GetComponent(BulletScript).m_Homing);
			
			//homing bullets are a little slower
			go.GetComponent(UpdateScript).m_DefaultMaxSpeed = 500;
			go.GetComponent(UpdateScript).m_MaxSpeed = 500;
			go.GetComponent(UpdateScript).m_Vel = go.GetComponent(UpdateScript).m_Vel.normalized * 500;
		}
		else
		{
			go.GetComponent(UpdateScript).m_DefaultMaxSpeed =1000;
			go.GetComponent(UpdateScript).m_MaxSpeed = 1000;
			go.GetComponent(UpdateScript).m_Vel = go.GetComponent(UpdateScript).m_Vel.normalized * 1000;
		}
	}
	

	var color = NetworkUtils.GetColor(m_Owner);
	if(go.GetComponent(TrailRenderer))
	{
		go.GetComponent(TrailRenderer).material.color = color;
		go.GetComponent(TrailRenderer).material.SetColor("_Emission", color);
	}
    go.GetComponent.<Renderer>().material.SetColor("_Color",color);
	go.GetComponent.<Renderer>().material.SetColor("_Emission", color);
	go.GetComponent(BulletScript).Start();
}
