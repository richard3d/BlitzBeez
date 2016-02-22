#pragma strict
var m_Owner : GameObject = null;
var m_MuzzleEffect : GameObject = null;
var m_AttachMuzzleEffect : boolean = true;
var m_SoundEffect : AudioClip = null;
var m_LoadOut : LoadOut;

var m_EffectPerRound : boolean = false;	//determines whether muzzle flash and sound effects should be generated for every bullet or just when the player pulls the trigger
function Start () {
	//m_LoadOut.CreateLoadOut(2);
}

function Update () {

	
	for(var i : int = 0; i < m_LoadOut.m_Pylons.length; i++)
	{
		var random =Random.Range(-m_LoadOut.m_Pylons[i].AngRandomOffset,m_LoadOut.m_Pylons[i].AngRandomOffset);
		if(m_LoadOut.m_Pylons[i].IsShooting())
		{
			var bulletPos : Vector3 = m_Owner.transform.right * m_LoadOut.m_Pylons[i].PosOffset.x + m_Owner.transform.up * m_LoadOut.m_Pylons[i].PosOffset.y + m_Owner.transform.forward * m_LoadOut.m_Pylons[i].PosOffset.z + m_Owner.transform.position;
			var rot : Quaternion = Quaternion.AngleAxis(m_LoadOut.m_Pylons[i].AngOffset+random, Vector3.up);
			var bulletVel : Vector3 =  rot * m_Owner.transform.forward;
			var temp:Vector3 = bulletVel;
			bulletVel.Normalize();
			bulletPos.y = m_Owner.transform.position.y;
			
			var go : GameObject = null;
			go = BulletScript.SpawnBullet(m_LoadOut.m_Pylons[i].m_BulletInstance,bulletPos,Vector3.zero);
			networkView.RPC("InitRound", RPCMode.All, go.name, bulletPos, bulletVel * go.GetComponent(UpdateScript).m_MaxSpeed, true);
		}
	}
}

function Fire()
{
	var shot:boolean = false;
	for(var p : int = 0; p < m_LoadOut.m_Pylons.length; p++)
	{
		if(m_LoadOut.m_Pylons[p].CanShoot())
			shot = true;
	}
	
	if(shot)
	{
		networkView.RPC("Shot", RPCMode.All);
	}
}

@RPC function Shot()
{
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
	m_Owner.transform.Find("Bee/NewBee").animation.Stop("flyandshoot");
	m_Owner.transform.Find("Bee/NewBee").animation["flyandshoot"].layer = 2;
	m_Owner.transform.Find("Bee/NewBee").animation["flyandshoot"].AddMixingTransform(m_Owner.transform.Find("Bee/NewBee/body/r_shoulder"));
	m_Owner.transform.Find("Bee/NewBee").animation.Play("flyandshoot");
	
	//perform kick back
	if(m_LoadOut.m_KickbackRecovery != 0)
	{
		m_Owner.AddComponent(ControlDisablerDecorator);
		m_Owner.GetComponent(ControlDisablerDecorator).SetLifetime(m_LoadOut.m_KickbackRecovery);
		m_Owner.GetComponent(UpdateScript).m_Accel = -m_Owner.transform.forward * m_Owner.GetComponent(UpdateScript).m_MaxSpeed*m_LoadOut.m_Kickback;
		m_Owner.GetComponent(UpdateScript).m_Vel = -m_Owner.transform.forward * m_Owner.GetComponent(UpdateScript).m_MaxSpeed*m_LoadOut.m_Kickback;
	}
}


@RPC function InitRound(bulletName : String, pos : Vector3, vel : Vector3, decrementAmmo:boolean)
{
	if(m_EffectPerRound)
		AudioSource.PlayClipAtPoint(m_SoundEffect, m_Owner.transform.position);
	var go : GameObject = gameObject.Find(bulletName);
	//make it so we dont collide with our own bullets
	if(go.collider.enabled && m_Owner.collider.enabled)
		Physics.IgnoreCollision(go.collider, m_Owner.collider);
				
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
    go.renderer.material.SetColor("_Color",color);
	go.renderer.material.SetColor("_Emission", color);
	go.GetComponent(BulletScript).Start();
}

// static function SpawnBullet(bulletType:GameObject, pos:Vector3, vel:Vector3) : GameObject
// {
	// var bs:BulletScript = bulletType.GetComponent(BulletScript);
	// var go:GameObject = null;
	
	// if(bs.m_PowerShot)
	// {
		// // if(m_PowerBulletPool[bs.m_PowerShotType+1] != null && m_PowerBulletPool[bs.m_PowerShotType+1].length > 0)
		// // {
			// // go = m_PowerBulletPool[bs.m_PowerShotType+1].Shift();
			// // go.transform.position = pos;
			// // go.GetComponent(UpdateScript).m_Vel = vel;
			// // go.GetComponent(BulletScript).m_Life = 1.25;
			// // go.active = true;	
			// // for(var t:Transform in go.transform)
			// // {
				// // t.gameObject.active = true;
				// // if(t.childCount > 0)
					// // t.GetChild(0).gameObject.active = true;
			// // }
		// // }
		// // else
		// // {
			// // //instantiate a new one
			// // go = Network.Instantiate(bulletType, pos , Quaternion.identity, 0);	
		// // }
	// }
	// else
	// {
		// if(m_BulletPool[bs.m_BulletType+1] != null && m_BulletPool[bs.m_BulletType+1].length > 0)
		// {
			// go = m_BulletPool[bs.m_BulletType+1].Shift();
			// go.transform.position = pos;
			// go.GetComponent(UpdateScript).m_Vel = vel;
			// //go.transform.LookAt(pos+vel);
			// go.GetComponent(BulletScript).m_Life = 1.25;
			// //go.GetComponent(BulletScript).Start();
			// go.active = true;	
			// for(var t:Transform in go.transform)
			// {
				// t.gameObject.active = true;
			// }
		// }
		// else
		// {
			// //instantiate a new one
			// go = Network.Instantiate(bulletType, pos , Quaternion.identity, 0);	
		// }
	// }
	// return go;
// }