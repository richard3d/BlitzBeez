//this script is intended to behave like a decorator

#pragma strict

private var  m_PrevMaxSpeed : float;

var  m_Lifetime : float = 1;
var m_MaxSpeed : float;

function Awake()
{
	m_PrevMaxSpeed = GetComponent(UpdateScript).m_MaxSpeed;
}

function Start () {

}

function Update () {

	m_Lifetime -= Time.deltaTime;
	GetComponent(UpdateScript).m_MaxSpeed = m_MaxSpeed;
	
	
	if(m_Lifetime <= 0.0)
	{
		GetComponent(UpdateScript).m_MaxSpeed = m_PrevMaxSpeed;
		Destroy(this);
	}
}

