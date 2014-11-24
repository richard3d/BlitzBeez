#pragma strict

var m_Owner : GameObject = null;
var m_ImpactEffect : GameObject = null;
var m_CollisionEffect : GameObject = null;
var m_ImpactTimer : float = 0;
var m_ImpactSound : AudioClip = null;

private var m_Lifetime : float = 10;

function Start () {

}

function Update () {

	transform.position = m_Owner.transform.position + m_Owner.transform.forward * 9;
	//transform.position.y = 7;
	transform.eulerAngles = m_Owner.transform.eulerAngles;
	var fSin : float = Mathf.Sin(Time.time*28);	
	
	if(m_ImpactTimer <= 0)
	{
		m_Owner.GetComponent(HammerDecorator).m_MovementEnabled = true;
		transform.eulerAngles.x = (fSin-1)*45;
	}
	else
		m_ImpactTimer -= Time.deltaTime;
		
	if(Network.isServer)
	{
		if(m_Lifetime <= 0 || m_Owner.GetComponent(RespawnDecorator) != null)
		{
			ServerRPC.Buffer(networkView, "KillHammerDecorator", RPCMode.All);
		}
		else
			m_Lifetime -= Time.deltaTime;
	}

}

@RPC function KillHammerDecorator()
{
	Destroy(m_Owner.GetComponent(HammerDecorator));
	if(m_Owner.GetComponent(BeeControllerScript) != null)
	{
		m_Owner.GetComponent(BeeControllerScript).m_ControlEnabled = true;
		m_Owner.GetComponent(BeeControllerScript).m_LookEnabled = true;
	}
	Destroy(gameObject);
	
}


@RPC function ActivateItem(owner : String)
{
	var go : GameObject = gameObject.Find(owner);
	if(go != null)
	{
		m_Owner = go;
		go.AddComponent(HammerDecorator);
		Debug.Log(go.renderer.material.color);
		GetComponent(ParticleSystemRenderer).material.SetColor("_TintColor", go.renderer.material.color);
	}
}

function OnTriggerEnter(other: Collider)
{
	if( other.gameObject.tag == "Hives" )
		{
			if(other.GetComponent(HiveScript).m_Owner != null && other.GetComponent(HiveScript).m_Owner != m_Owner)
			{
				Debug.Log(other.gameObject .name);
				m_ImpactTimer = 0.5;
				m_Owner.GetComponent(HammerDecorator).m_MovementEnabled = false;
				
				var go:GameObject = gameObject.Instantiate(m_CollisionEffect);
				go.transform.position = other.gameObject.transform.position;
			}
		
		}
	else if( other.gameObject.tag == "Flowers")
		{
			if(other.GetComponent(FlowerScript).m_Owner != null && other.GetComponent(FlowerScript).m_Owner != m_Owner)
			{
				Debug.Log(other.gameObject .name);
				m_ImpactTimer = 0.5;
				m_Owner.GetComponent(HammerDecorator).m_MovementEnabled = false;
				
				go = gameObject.Instantiate(m_CollisionEffect);
				go.transform.position = other.gameObject.transform.position;
			}
			
		}
}

function OnCollisionEnter(coll : Collision)
{
	var other : Collider = coll.collider;
	if(other.gameObject.tag == "Terrain")
	{
		AudioSource.PlayClipAtPoint(m_ImpactSound, Camera.main.transform.position);
		 var go : GameObject;// = gameObject.Instantiate(m_ImpactEffect);
		// go.transform.position = m_Owner.transform.position + m_Owner.transform.forward * 40;
		// go.transform.position.y = 0;
		Camera.main.GetComponent(CameraScript).Shake(0.25,1.5);
		
	}
	else if(other.gameObject != m_Owner)
	{
		if(other.gameObject.tag == "Player" ||
		/*other.gameObject.tag == "ItemBoxes" ||*/
		   other.gameObject.tag == "Rocks")
		{
			Debug.Log(other.gameObject .name);
			m_ImpactTimer = 0.5;
			m_Owner.GetComponent(HammerDecorator).m_MovementEnabled = false;
			
			go = gameObject.Instantiate(m_CollisionEffect);
			go.transform.position = other.gameObject.transform.position;
			//go.transform.position.y = 1;
		}
	}
}