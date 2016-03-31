#pragma strict
enum BulletType { Standard, Rocket, Sniper, Shotgun, NumBullets }
private static var m_InstanceID : int = 0;
var m_Projectile:boolean = true;	//this is used for the calculation (either velocity based or instantaneous)
var m_Life : float = 1.25;
private var m_LifeTimer : float = 1.25;
var m_TrailEffect : GameObject = null;	//this effect is spawned when the bullet is, and is attached to the bullet but is not part of the lifecycle hence using this property is more expensive
var m_HitEffect : GameObject = null;
var m_BombExplosion:GameObject = null; 
//var m_SoundEffect : AudioClip = null;
var m_HitSoundEffect : AudioClip = null;
var m_PowershotEffect:GameObject = null;

private var m_LaserEffect : GameObject = null;
private var m_NumHits: int = 0; //collision counter
var m_PowerShot : boolean = false;
var m_BulletType : BulletType;
var m_PowerShotType : int = -1;
var m_Owner : GameObject = null;
var m_Tgt : GameObject = null;
var m_Homing : float = 0;
var m_BaseDmg : int = 1;

static var m_BulletPool:Array[] = new Array[10];
static var m_PowerBulletPool:Array[] = new Array[BulletType.Shotgun];

private var m_MarkedForDeath : boolean = false; //only applied to projectiles
//private var m_TimeToCollision : float = 0;


class BulletCollision implements System.IComparable
{
	var hit:RaycastHit;
	var bullet:GameObject;
	
	 function CompareTo(obj: Object) : int {
	 
		var other:BulletCollision = obj;
		return hit.distance.CompareTo(other.hit.distance);
		
     }  
}

static function SpawnBullet(bulletType:GameObject, pos:Vector3, vel:Vector3) : GameObject
{
	var bs:BulletScript = bulletType.GetComponent(BulletScript);
	var go:GameObject = null;
	
	if(bs.m_PowerShot)
	{
		if(m_PowerBulletPool[bs.m_PowerShotType+1] != null && m_PowerBulletPool[bs.m_PowerShotType+1].length > 0)
		{
			go = m_PowerBulletPool[bs.m_PowerShotType+1].Shift();
			go.transform.position = pos;
			go.GetComponent(UpdateScript).m_Vel = vel;
			go.GetComponent(BulletScript).m_LifeTimer = go.GetComponent(BulletScript).m_Life;
			go.active = true;	
			for(var t:Transform in go.transform)
			{
				t.gameObject.active = true;
				if(t.childCount > 0)
					t.GetChild(0).gameObject.active = true;
			}
		}
		else
		{
			//instantiate a new one
			go = Network.Instantiate(bulletType, pos , Quaternion.identity, 0);	
		}
	}
	else
	{
		if(m_BulletPool[bs.m_BulletType] != null && m_BulletPool[bs.m_BulletType].length > 0)
		{
			go = m_BulletPool[bs.m_BulletType].Shift();
			go.transform.position = pos;
			go.GetComponent(UpdateScript).m_Vel = vel;
			//go.transform.LookAt(pos+vel);
			go.GetComponent(BulletScript).m_LifeTimer = go.GetComponent(BulletScript).m_Life;
			//go.GetComponent(BulletScript).Start();
			go.active = true;	
			for(var t:Transform in go.transform)
			{
				t.gameObject.active = true;
			}
		}
		else
		{
			//instantiate a new one
			go = Network.Instantiate(bulletType, pos , Quaternion.identity, 0);	
		}
	}
	return go;
}

static function RecycleBullet(bullet:GameObject)
{
	var bs:BulletScript = bullet.GetComponent(BulletScript);
	if(bs.m_PowerShot)
	{
		if(m_PowerBulletPool[bs.m_PowerShotType+1] == null)
			m_PowerBulletPool[bs.m_PowerShotType+1] = new Array();
		bullet.active = false;
		for(var t:Transform in bullet.transform)
		{
			t.gameObject.active = false;
			if(t.childCount > 0)
				t.GetChild(0).gameObject.active = false;
		}
		if(bullet.GetComponent(ParticleSystem) != null)
			bullet.GetComponent(ParticleSystem).Clear();
		m_PowerBulletPool[bs.m_PowerShotType+1].Push(bullet);
	}
	else
	{
		if(m_BulletPool[bs.m_BulletType] == null)
			m_BulletPool[bs.m_BulletType] = new Array();
		bullet.active = false;
		for(var t:Transform in bullet.transform)
		{
			if(t.GetComponent(ParticleAutoDestructScript) == null)
				t.gameObject.active = false;
			else
				t.parent = null;
		}
		if(bullet.GetComponent(ParticleSystem) != null)
			bullet.GetComponent(ParticleSystem).Clear();
		m_BulletPool[bs.m_BulletType].Push(bullet);
	}
	bullet.GetComponent(BulletScript).m_Tgt = null;
	bullet.GetComponent(BulletScript).m_Homing = 0;
}

function Awake()
{
	gameObject.name = "Bullet"+ ++m_InstanceID;
}



function Start () {

	
	var hit:RaycastHit;
	if(m_PowerShot)
	{
		//create laser effect if we are a lasershot
		if(m_PowerShotType == 0)
		{
			m_LaserEffect = GameObject.Instantiate(Resources.Load("GameObjects/LaserBeam"), transform.position, transform.rotation);
			m_LaserEffect.transform.localEulerAngles.x = 90;
			m_LaserEffect.GetComponent(LaserBeamScript).m_EndColor = GetComponent(TrailRenderer).material.GetColor("_Emission");
			m_LaserEffect.GetComponent(LaserBeamScript).m_StartColor = m_LaserEffect.GetComponent(LaserBeamScript).m_EndColor*1.5;
			GetComponent(UpdateScript).m_MaxSpeed = 3000;
			GetComponent(UpdateScript).m_Vel = GetComponent(UpdateScript).m_Vel.normalized*3000;
			
		}
	}
	else
	{
		
	}
	
	if(m_Owner)
	{
	
		transform.position.y = m_Owner.transform.position.y;
		
		
		if(Network.isServer)
		{
			if(m_Projectile)
			{
				var up : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
				up.m_PrevPos = transform.position;
				var radius = (transform.localScale.x * GetComponent(SphereCollider).radius);
				if(Physics.Linecast(m_Owner.transform.position,transform.position+up.m_Vel.normalized * radius,hit))
				{
					//Debug.Log("PASSED");
					if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
					{
						//Debug.Log("WWWWWWWWWWWW "+hit.collider.gameObject.name);
					
						var coll:BulletCollision = new BulletCollision();
						coll.hit = hit;
						coll.bullet = gameObject;
						OnBulletCollision(coll);
						hit.collider.gameObject.SendMessage("OnBulletCollision", coll, SendMessageOptions.DontRequireReceiver);
						
					}
					else
					{
						
					}
				}
				else
				{
					//Debug.Log("Coll failed ABOVE"+(m_Owner.transform.position) +" "+ (transform.position+up.m_Vel.normalized * (transform.localScale.x * GetComponent(SphereCollider).radius)+up.m_Vel*Time.deltaTime));
				}
			}
			else
			{
				up = GetComponent(UpdateScript) as UpdateScript;
				//(transform.position+up.m_Vel.normalized * renderer.bounds.extents.x - up.m_PrevPos).magnitude
				var dist = up.m_MaxSpeed;
				
				radius = transform.localScale.x * GetComponent(SphereCollider).radius;
				var hits:RaycastHit[];
				var arr = new Array();
				for(var i:int = 0; i < 6; i++)
				{
					var dir:Vector3 = Quaternion.AngleAxis( (i-3)*5, Vector3.up) * up.m_Vel.normalized;
					hits = Physics.SphereCastAll(transform.position,radius,dir, dist);
					
					//collect all htis and store them in the bullet collision struct, this is then put into an array for sorting
					if(hits.length > 0)
					{
						//Debug.Log("Coll passed!");
						for(hit in hits)
						{
							if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
							{
								coll = new BulletCollision();
								coll.hit = hit;
								coll.bullet = gameObject;
								arr.Push(coll);
							}
						}
					}
					else 
					{
						hits = Physics.RaycastAll(transform.position,dir, dist);
						for(hit in hits)
						{
							if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
							{
								coll = new BulletCollision();
								coll.hit = hit;
								coll.bullet = gameObject;
								arr.Push(coll);
							}
						}
					}
					//sort the bullet collisions (near to far) and process them
					arr.Sort();
					var break1 = false;
					if( i == 5)
						m_MarkedForDeath = true;
					for(coll in arr)
					{
						//Debug.Log("COLL "+coll.hit.collider.gameObject.name);
						if(OnBulletCollision(coll))
						{
							break1 = true;
							coll.hit.collider.gameObject.SendMessage("OnBulletCollision", coll, SendMessageOptions.DontRequireReceiver);
						}
						if(break1)
							break;
					}
					
					
				}
				
				
			}
		}
	}
	
	
	// //Pick a target for homing bullets
	 if(m_BulletType == BulletType.Rocket)
		m_Life = 10;
}

function Update () {
	if(!m_Projectile)
		return;
	GetComponent.<Rigidbody>().velocity = Vector3(0,0,0);
	// if(m_Owner == null)
		// return;
	var up : UpdateScript = GetComponent(UpdateScript) as UpdateScript;
	
	var hit:RaycastHit;
	if(Network.isServer)
	{
		//(transform.position+up.m_Vel.normalized * renderer.bounds.extents.x - up.m_PrevPos).magnitude
		var dist = (transform.position - up.m_PrevPos).magnitude;
		if(dist == 0.0)
		{
			dist = up.m_Vel.magnitude*Time.deltaTime;
		}
		var radius = transform.localScale.x * GetComponent(SphereCollider).radius;
		var hits:RaycastHit[];
		hits = Physics.SphereCastAll(up.m_PrevPos,radius,up.m_Vel.normalized, dist);
	    var arr = new Array();
		
		//collect all htis and store them in the bullet collision struct, this is then put into an array for sorting
		if(hits.length > 0)
		{
			//Debug.Log("Coll passed!");
			for(hit in hits)
			{
				if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
				{
					var coll:BulletCollision = new BulletCollision();
					coll.hit = hit;
					coll.bullet = gameObject;
					arr.Push(coll);
				}
			}
		}
		else 
		{
			hits = Physics.RaycastAll(up.m_PrevPos,up.m_Vel.normalized, dist);
			for(hit in hits)
			{
				if(hit.collider.gameObject != gameObject && hit.collider.gameObject != m_Owner)
				{
					coll = new BulletCollision();
					coll.hit = hit;
					coll.bullet = gameObject;
					arr.Push(coll);
				}
			}
			//Debug.Log("Coll failed "+(up.m_PrevPos) +" "+ (up.m_PrevPos+up.m_Vel.normalized * dist)+" "+(transform.localScale.x * GetComponent(SphereCollider).radius));
		}
		
		//sort the bullet collisions (near to far) and process them
		arr.Sort();
		var break1 = false;
		for(coll in arr)
		{
			//Debug.Log("COLL "+coll.hit.collider.gameObject.name);
			if(OnBulletCollision(coll))
			{
				break1 = true;
				coll.hit.collider.gameObject.SendMessage("OnBulletCollision", coll, SendMessageOptions.DontRequireReceiver);
			}
			if(break1)
				break;
		}
	
		//homing round seeking
		if(m_BulletType == BulletType.Rocket)
		{
			if(m_Tgt != null)
			{//Physics.Linecast(transform.position,m_Tgt.transform.position,hit);
				if(Vector3.Dot(up.m_Vel,m_Tgt.transform.position - transform.position) > 0 && Physics.Linecast(transform.position,m_Tgt.transform.position,hit))
				{
					if(hit.collider.gameObject == gameObject || hit.collider.gameObject == m_Tgt)
					{
						var diff : Vector3 = ((m_Tgt.transform.position + m_Tgt.GetComponent(UpdateScript).m_Vel * Time.deltaTime * m_Homing) - transform.position) * m_Homing;
						if(diff.magnitude > GetComponent(UpdateScript).m_MaxSpeed)
							diff = diff.normalized * GetComponent(UpdateScript).m_MaxSpeed;
						up.m_Vel += diff * (Time.deltaTime*10 + 5 * m_Homing/3); 
						//transform.LookAt(transform.position+up.m_Vel);
					}
				}
				transform.LookAt(transform.position+up.m_Vel);
			}
		}
	}
	
	
	
	
	if(m_PowerShot)
	{
		transform.LookAt(transform.position + up.m_Vel);
		
		if(m_PowerShotType == 0)
		{
			if(m_LaserEffect != null)
			{
				var length:float = (transform.position - m_Owner.transform.position).magnitude;
				m_LaserEffect.GetComponent(LaserBeamScript).m_EndScale.y = length*2;
				m_LaserEffect.GetComponent(LaserBeamScript).m_StartScale.y = length*2;	
			}
		}
	}
	
	if(Network.isClient)
		return;
		
	if(	m_LifeTimer > 0.0)
	{
		m_LifeTimer -= Time.deltaTime;	
		if(m_LifeTimer <= 0.0)
		{
		
			ServerRPC.Buffer(GetComponent.<NetworkView>(), "KillBullet", RPCMode.All, gameObject.transform.position, false);
			ServerRPC.DeleteFromBuffer(gameObject);
			//GameObject.Find("GameServer").GetComponent(ServerScript).m_SyncMsgsView.RPC("NetworkDestroy", RPCMode.All, gameObject.name);
		}
	}

}


function OnBulletCollision(coll:BulletCollision) : boolean
{
	//Debug.Log("BULLET COLLISION: "+coll.hit.collider.gameObject.name );
	var tag:String = coll.hit.collider.gameObject.tag;
	var other:GameObject = coll.hit.collider.gameObject;
	if(coll.hit.collider.isTrigger)
	{
		if(tag != "Flowers" && tag != "Hives")
			return false;
	}
	
	
	
	if(m_PowerShot)
	{
		switch (m_PowerShotType)
		{
			//standard (-1) laser {0} explosive (1) scatter(2) bull (3) homing spread (4)
		    case 0:
				 if(tag == "Player" || tag == "Rocks" || tag == "Terrain" || tag == "Trees" || tag == "ItemBoxes" ||  
				   (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner) ||
				   (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner != m_Owner))
				   {
						if(m_LaserEffect != null)
						{
							//Debug.Log("SHORTENING");
							var diff:Vector3 = (coll.hit.point - transform.position);
							diff = Vector3.Project(diff, GetComponent(UpdateScript).m_Vel.normalized);
							var length:float = (coll.hit.point - transform.position).magnitude;
							m_LaserEffect.GetComponent(LaserBeamScript).m_EndScale.y = length*2;
							m_LaserEffect.GetComponent(LaserBeamScript).m_StartScale.y = length*2;	
						}
						var pos = transform.position;
						transform.position = coll.hit.point;
						RemoveBullet(pos+diff);
						return true;
				   }
				   // else
				   // {
						// ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, coll.hit.point);
				   // }
			break;
			case 2:
				if( tag == "Player" || tag == "Rocks" || tag == "Terrain" || tag == "Trees" || tag == "ItemBoxes" ||  
				   (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner)||
				   (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team))
				{
					var refNorm : Vector3 = coll.hit.normal;
					refNorm.y = 0;
					refNorm.Normalize();
					var refVel : Vector3 = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
					refVel.y = 0;
					//Debug.Log("NORMAL " +refVel);
					refVel.Normalize();
					GetComponent(UpdateScript).m_Vel = refVel;
					//creates splinter bullet
					//m_PowerShotType = -1; 
					//create shrapnel bullets
					for(var i = 0 ; i < 9; i++)
					{
						var rot :Quaternion = Quaternion.AngleAxis((i-4) * 15,Vector3.up); 
						if( i == 0)
						{
							rot = Quaternion.identity;
						}
						refVel = rot*refNorm;
						var go : GameObject  = Network.Instantiate(Resources.Load("GameObjects/FletchetBullet"), transform.position + refVel * 2, Quaternion.LookRotation(refVel, Vector3.up), 0);	
						go.GetComponent(BulletScript).m_BulletType = 0;
						m_Owner.GetComponent.<NetworkView>().RPC("Shot", RPCMode.All, go.name, go.transform.position+ refVel * 2, refVel * go.GetComponent(UpdateScript).m_MaxSpeed*Random.Range(0.6,1), false);
					}
					
					RemoveBullet(coll.hit.point);	
				}
				return true;
			break;
				//bulldozer powerbullet
				case 3:
				//these are objects we doze (pass through) and trigger a response out of (like destroying a rock)
				if( tag == "Player" || tag == "Rocks"  || tag == "ItemBoxes")
				{
					ServerRPC.Buffer(GetComponent.<NetworkView>(), "BulletHitOriented", RPCMode.All, transform.position+transform.forward * transform.localScale.x, GetComponent(UpdateScript).m_Vel.normalized);
					if(GetComponent(PauseDecorator) == null)
					{
						gameObject.AddComponent(PauseDecorator);
						GetComponent(PauseDecorator).m_Lifetime = 0.12;
					}
					return false;
				}
				//items we pass through but do not trigger any response
				else if(tag =="Coins" || tag == "Items" 
						|| (tag == "Flowers" && (other.GetComponent(FlowerScript).m_Owner == null || other.GetComponent(FlowerScript).m_Owner == m_Owner))
						|| (tag == "Hives" && (other.GetComponent(HiveScript).m_Owner == null || other.GetComponent(HiveScript).m_Owner == m_Owner)))
				{
				}
				//solid items we should not pass through at all
				else 
				{
					RemoveBulletOriented(coll.hit.point, coll.hit.normal);
					return true;
				}
			break;
			
			default:
			if(tag == "Player" || tag == "Rocks" ||  tag == "Terrain" || tag == "Trees" || tag == "Bears" || tag == "ItemBoxes" ||
				  (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner)||
				    (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team))
				  {
					RemoveBullet(coll.hit.point);
					return true;
				}
				else if(tag == "Shield" )
					{
						if(other.GetComponent(FlowerShieldScript).m_Owner != m_Owner)
						{
							RemoveBullet(coll.hit.point);
							return true;
						}
					}
			break;
		}
	}
	else
	{
		switch (m_BulletType)
		{
			//ricochet type
			// case 0: 
				// refNorm = coll.hit.normal;
				// refNorm.y = 0;
				// refNorm.Normalize();
				// refVel = Vector3.Reflect(GetComponent(UpdateScript).m_Vel, refNorm);
				// refVel.y = 0;
				// m_NumHits++;
				// //m_BulletType = -1;
				// refVel.Normalize();
				// GetComponent(UpdateScript).m_Vel = refVel*GetComponent(UpdateScript).m_MaxSpeed;
				// transform.LookAt(transform.position + GetComponent(UpdateScript).m_Vel);
				// ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
				
				// if(m_NumHits >= 2)
				// {
					// if((tag == "Player" && other.GetComponent(BeeDashDecorator) == null) || tag == "Rocks" ||   tag == "Terrain" || tag == "Trees" || tag == "Bears" ||  tag == "ItemBoxes" ||
					  // (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner) ||
					  // (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner != m_Owner))
					  // {
						
							// RemoveBullet(coll.hit.point);
							// return true;
						// }	
						// else if(tag == "Shield" )
						// {
							// if(other.GetComponent(FlowerShieldScript).m_Owner != m_Owner)
							// {
								// RemoveBullet(coll.hit.point);
								// return true;
							// }
						// }
				// }
			// break;
			// //penetration
			// // case 1:
				// // if(coll.hit.collider.gameObject.GetComponent(PenetrableScript) != null)
				// // {
					// // var sum = Dice.RollDice(1, 6);
					// // if(sum/6.0 > (1-coll.hit.collider.gameObject.GetComponent(PenetrableScript).m_PercentChanceOfPenetration))
					// // {
						// // //m_BulletType = -1;
						// // ServerRPC.Buffer(networkView, "BulletHit", RPCMode.All, transform.position+transform.forward * transform.localScale.x);
					// // }
					// // else
					// // {
						
						// // RemoveBullet(transform.position+transform.forward * transform.localScale.x);
						// // return true;
					
					// // }
				// // }
				// // else
				// // {
					// // RemoveBullet(transform.position+transform.forward * transform.localScale.x);
					// // return true;
				// // }
			// // break;
			// case 2:
				// if((tag == "Player" && other.GetComponent(BeeDashDecorator) == null) || tag == "Rocks" ||   tag == "Terrain" || tag == "Trees" || tag == "Bears" ||  tag == "ItemBoxes" ||
				  // (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner) ||
				   // (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team))
				  // {
					
						// RemoveBullet(coll.hit.point);
						// return true;
					// }	
					// else if(tag == "Shield" )
					// {
						// if(other.GetComponent(FlowerShieldScript).m_Owner != m_Owner)
						// {
							// RemoveBullet(coll.hit.point);
							// return true;
						// }
					// }
			// break;
			// case 4:
			// if(tag == "Player" || tag == "Rocks" ||  tag == "Terrain" || tag == "Trees" || tag == "Bears" || tag == "ItemBoxes" ||
				  // (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner)||
				    // (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team))
				  // {
					
					// RemoveBullet(coll.hit.point);
					// return true;
					
				// }
				// else if(tag == "Shield" )
					// {
						// if(other.GetComponent(FlowerShieldScript).m_Owner != m_Owner)
						// {
							
							// RemoveBullet(coll.hit.point);
							// return true;
							
						// }
					// }
			// break;
			default:
		
				if((tag == "Player" && other.GetComponent(BeeDashDecorator) == null) || tag == "Rocks" ||   tag == "Terrain" || tag == "Trees" || tag == "Bears" ||  tag == "ItemBoxes" ||
				  (tag == "Hives" && other.GetComponent(HiveScript).m_Owner != m_Owner) ||
				  (tag == "Flowers" && other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner.GetComponent(BeeScript).m_Team != m_Owner.GetComponent(BeeScript).m_Team))
				  {
					
						RemoveBullet(coll.hit.point);
						return true;
					}	
					else if(tag == "Shield" )
					{
						if(other.GetComponent(FlowerShieldScript).m_Owner != m_Owner)
						{
							RemoveBullet(coll.hit.point);
							return true;
						}
					}
			break;
		}
	}
	return false;
}




@RPC function BulletHitOriented(pos:Vector3, norm:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos;
	go.transform.LookAt(pos+norm);
	if(m_PowerShot)
	{
		if(GetComponent.<Renderer>().isVisible)
			Camera.main.GetComponent(CameraScript).Shake(0.25,2);
	}
}

@RPC function BulletHit(pos:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos;
	if(m_PowerShot)
	{
		if(GetComponent.<Renderer>().isVisible)
			Camera.main.GetComponent(CameraScript).Shake(0.25,2);
	}
}

function RemoveBulletOriented(pos:Vector3, norm:Vector3)
{
	//this function first checs if the bullet is already marked as 'dead' (by checking the lifespan)
	//it is possible a bullet collides with multiple objects at once but we can only have the rpc call happen once
	//otherwise the client destroys the bullet and another RPC arrives from the server due to second collision
	if(m_LifeTimer > 0)
	{
		ServerRPC.Buffer(GetComponent.<NetworkView>(), "KillBulletOriented", RPCMode.All, pos, norm);
		ServerRPC.DeleteFromBuffer(gameObject);
	}
	m_LifeTimer = -1;
}

function RemoveBullet(pos:Vector3)
{
	//this function first checs if the bullet is already marked as 'dead' (by checking the lifespan)
	//it is possible a bullet collides with multiple objects at once but we can only have the rpc call happen once
	//otherwise the client destroys the bullet and another RPC arrives from the server due to second collision
	if(m_LifeTimer > 0)
	{
		ServerRPC.Buffer(GetComponent.<NetworkView>(), "KillBullet", RPCMode.All, pos, true);
		ServerRPC.DeleteFromBuffer(gameObject);
	}
	m_LifeTimer = -1;
}

@RPC
function KillBulletOriented(pos:Vector3, norm:Vector3)
{
	var go : GameObject = gameObject.Instantiate(m_HitEffect);
	go.transform.position = pos+norm;
	go.transform.LookAt(pos+norm*2);
	if(m_PowerShot)
	{
		switch (m_PowerShotType)
		{
			//explosive
			case 1: 
				go = gameObject.Instantiate(m_BombExplosion, transform.position, Quaternion.identity);
				go.GetComponent(BombExplosionScript).m_Owner = m_Owner;
				//go.transform.position = transform.position;
				
				Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
			break;
			//scatter
			case 2: 
				
			break;
		}
		

	}
	else
	{
		// switch (m_BulletType)
		// {
			// //explosive
			// case 1: 
			
			// break;
			// //scatter
			// case 2: 
				// go.GetComponent(BombExplosionScript).m_Owner = m_Owner;
			// break;
		// }
	}
	if(m_HitSoundEffect != null)
		AudioSource.PlayClipAtPoint(m_HitSoundEffect, pos);
	Destroy(gameObject);
} 

@RPC
function KillBullet(pos:Vector3, collision:boolean)
{
	var go : GameObject = null;
	if(collision)
	{
		go = gameObject.Instantiate(m_HitEffect,pos,Quaternion.identity);
		go.transform.position = pos;
	}
	
	if(m_PowerShot)
	{
		switch (m_PowerShotType)
		{
			//explosive
			case 1: 
				go = gameObject.Instantiate(m_BombExplosion, transform.position, Quaternion.identity);
				go.GetComponent(BombExplosionScript).m_Owner = m_Owner;
				go.transform.position = transform.position;
				
				Camera.main.GetComponent(CameraScript).Shake(0.25,0.5);
			break;
			//scatter
			case 2: 
			break;
		}
		

	}
	else
	{
		switch (m_BulletType)
		{
			case BulletType.Rocket: 
				if(go != null)
					go.GetComponent(BombExplosionScript).m_Owner = m_Owner;
			break;
			case BulletType.Shotgun: 
				if(collision)
				{
					//generate a hit effect for each pellet
					for(var t:Transform in transform)
					{
						go  = gameObject.Instantiate(m_HitEffect,t.position,Quaternion.identity);
					}
				}
			break;
		}
	}
	
	if(m_HitSoundEffect != null)
		AudioSource.PlayClipAtPoint(m_HitSoundEffect, pos);
	
	RecycleBullet(gameObject);
	//if(m_PowerShot)
	//	Destroy(gameObject);
} 

@RPC function RemoveComponent(compName:String)
{
	DestroyImmediate(GetComponent(compName));
}

@RPC
function DamageHive(hiveName:String, dmgAmt:int)
{
	var hive:GameObject = gameObject.Find(hiveName);
	hive.GetComponent(HiveScript).m_HP -= dmgAmt;
	
	
	if(hive.GetComponent(FlasherDecorator) == null)
	{
		hive.AddComponent(FlasherDecorator);
		hive.GetComponent(FlasherDecorator).m_FlashDuration = 0.1;
		hive.GetComponent(FlasherDecorator).m_NumberOfFlashes = 1;
	}
	
	if(hive.GetComponent(HiveScript).m_HP <= 0)
	{
		//destroy the hive
		Destroy(gameObject.Find(hiveName));
	}
	else
		hive.GetComponent(HiveScript).m_LifebarTimer = 2;
}