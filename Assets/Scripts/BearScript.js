#pragma strict
var m_Radius : float = 100;
var m_HitTimer : float = 0;
var m_Diff:Vector3;
private var m_InitialPos : Vector3;
function Start () {

	m_InitialPos = transform.position;
	animation.Play("BearWalk");

}

function Update () {

	
	rigidbody.velocity = Vector3(0,0,0);
	var dist : float = 99999;
	var target : GameObject = null;
	
	for(var bee : GameObject in gameObject.FindGameObjectsWithTag("Player"))
	{
		var diff : Vector3 = bee.transform.position - transform.parent.position;
		if(diff.magnitude < dist )
		{
			dist = diff.magnitude;
			target = bee;
		}
	}
	
	if(true)
	{
		m_Diff = target.transform.position - transform.position;
		m_Diff.y = 0;
		//GetComponent(UpdateScript).m_Vel += diff * Time.deltaTime;
	}
	else
	{
		m_Diff = m_InitialPos - transform.position;
		m_Diff.y = 0;
		GetComponent(UpdateScript).m_Vel += m_Diff * Time.deltaTime;	
	}
	
	// transform.eulerAngles.z = Mathf.Sin(Time.time * 6) * 15;
	// transform.position.y = 0;

}
function Step()
{
		transform.parent.position += m_Diff.normalized*14;
}

function Turn()
{
	 transform.parent.LookAt(transform.parent.position + m_Diff);
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
