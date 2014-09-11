#pragma strict
var m_Radius : float = 100;
var m_HitTimer : float = 0;
private var m_InitialPos : Vector3;
function Start () {

	m_InitialPos = transform.position;

}

function Update () {

	
	rigidbody.velocity = Vector3(0,0,0);
	var dist : float = 99999;
	var target : GameObject = null;
	
	for(var bee : GameObject in gameObject.FindGameObjectsWithTag("Player"))
	{
		var diff : Vector3 = bee.transform.position - transform.position;
		if(diff.magnitude < dist && (m_InitialPos - bee.transform.position).magnitude < m_Radius)
		{
			dist = diff.magnitude;
			target = bee;
		}
	}
	
	if(target)
	{
		diff = target.transform.position - transform.position;
		diff.y = 0;
		GetComponent(UpdateScript).m_Vel += diff * Time.deltaTime;
	}
	else
	{
		diff = m_InitialPos - transform.position;
		diff.y = 0;
		GetComponent(UpdateScript).m_Vel += diff * Time.deltaTime;	
	}
	transform.LookAt(transform.position + GetComponent(UpdateScript).m_Vel);
	transform.eulerAngles.z = Mathf.Sin(Time.time * 6) * 15;
	transform.position.y = 0;

}

function OnCollisionEnter(coll : Collision) {

	//if we hit a bee we should move him
	if(Network.isServer)
	{
		if(coll.gameObject.tag == "Player")
		{
			var vDiff : Vector3 = coll.gameObject.transform.position - transform.position;
			vDiff.y = 0;
			coll.gameObject.GetComponent(UpdateScript).m_Vel = vDiff * 250;
			coll.gameObject.GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
			//coll.gameObject.networkView.RPC("Daze", RPCMode.All, true);
			//coll.gameObject.AddComponent(ControlDisablerDecorator);
			//coll.gameObject.GetComponent(ControlDisablerDecorator).SetLifetime(1.0);
		}
		else if(coll.gameObject.tag == "Hammer")
		{
			
		}
		else if(coll.gameObject.tag == "Bullets")
		{
			if(GetComponent(MovementDecorator) == null)
			{
			gameObject.AddComponent(MovementDecorator);
			GetComponent(MovementDecorator).m_MaxSpeed = 0;
			GetComponent(MovementDecorator).m_Lifetime = 0.15;
			}
			gameObject.networkView.RPC("onBulletHit", RPCMode.All);
		}
	}
}

@RPC function onBulletHit()
{
	gameObject.animation.Play("BearHit");
}
