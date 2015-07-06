#pragma strict

var m_Lifespan : float = 3;
var m_EnableVel : boolean = false;
private var m_Effect : GameObject;
function Awake()
{
	gameObject.AddComponent(ControlDisablerDecorator);
	GetComponent(BeeScript).m_Bounce = false;
	GetComponent(UpdateScript).m_NetUpdateRotation = false;
	m_EnableVel = false;
}

function Start () {

	m_Effect = gameObject.Instantiate(GetComponent(BeeScript).m_DazeEffect);
}

function Update () {

	m_Effect.transform.position = transform.position + Vector3(0,6,0);
	//if(!m_EnableVel)
	//	GetComponent(UpdateScript).m_Vel = Vector3(0,0,0);
	//GetComponent(UpdateScript).m_Accel = Vector3(0,0,0);
	transform.eulerAngles.x = Mathf.Sin(Time.time *9 ) * 25;	
	transform.eulerAngles.z = Mathf.Sin((Time.time +1.57) * 9) * 25;
	
	m_Lifespan -= Time.deltaTime;
	if(m_Lifespan < 0)
	{
		
		Destroy(this);
	}

}

function OnDestroy()
{
	transform.eulerAngles.x = 0;	
	transform.eulerAngles.z = 0;
	gameObject.Destroy(m_Effect);
	Destroy(GetComponent(ControlDisablerDecorator));
	GetComponent(BeeScript).m_Bounce = true;
	GetComponent(UpdateScript).m_NetUpdateRotation = true;
	
}