#pragma strict
import Dice;

var m_BombExplosion : GameObject = null;
var m_ImpactExplosion : GameObject = null;
var m_Owner : GameObject = null;
var m_Lifetime : float = 3;
var m_ActivateSound : AudioClip = null;


private var m_InitiaPos : Vector3;
private static var m_InstanceID : int = 0;

//lightning item is an empty gameobject that just adds the lightning decorator

function Awake()
{
	//animation.Play("Bomb");
	//gameObject.name = "Bomb"+ ++m_InstanceID;
}
function Start () {

}

function Update () {

	if(Network.isServer)
	{
		
		
	
	}
}

function OnCollisionEnter(coll : Collision)
{
	if(Network.isServer)
	{
		
	}
}


@RPC function ActivateItem(owner : String)
{

	var go : GameObject = gameObject.Find(owner);
	if(go != null)
	{
		m_Owner = go;
		transform.parent = go.transform;
		transform.position = go.transform.position;
		go.AddComponent(LightningDecorator);
		go.GetComponent(LightningDecorator).SetLifetime(0.25);
		
		AudioSource.PlayClipAtPoint(m_ActivateSound, go.GetComponent(BeeScript).m_Camera.transform.position);
	}
}

function OnDestroy()
{
	var go : GameObject = gameObject.Instantiate(m_BombExplosion);
	go.GetComponent(BombExplosionScript).m_Owner = m_Owner;
	var coll:SphereCollider = go.collider as SphereCollider;
	coll.radius = 30;
	go.transform.position = transform.position;
	go.transform.position.y = 0;
	Physics.IgnoreCollision(m_Owner.collider, coll);
	
	
	go = gameObject.Instantiate(m_ImpactExplosion);
	go.GetComponent(ParticleSystem).startSize = 75;
	go.transform.position = transform.position;
	go.transform.position.y = 0;
	
	go = gameObject.Instantiate(m_Owner.GetComponent(BeeScript).m_DeathEffect);
	go.transform.position = transform.position;
	go.renderer.material.SetColor("_TintColor", renderer.material.color);
	
	if(NetworkUtils.IsLocalGameObject(m_Owner))
	{
		var cam:GameObject = m_Owner.GetComponent(BeeScript).m_Camera;
		cam.GetComponent(CameraScript).Shake(0.33,3.5);
		// cam.AddComponent(CameraZoomDecorator);
		// cam.GetComponent(CameraZoomDecorator).m_fLifetime = 0.25;
		// cam.GetComponent(CameraZoomDecorator).m_ZoomFOV = 45;
	}
}



