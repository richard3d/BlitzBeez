#pragma strict

private var m_Lifetime : float = 0.0;

function Awake()
{
	GetComponent(BeeControllerScript).m_ControlEnabled = false;
	GetComponent(NetworkInputScript).m_ControlEnabled = false;
}

function Start () {

	//Debug.Log("added disaabler");

}

function Update () {

	
	if(m_Lifetime > 0.0)
	{
		m_Lifetime -= Time.deltaTime;
		if(m_Lifetime <= 0.0)	
			Destroy(this);
	}
}

function OnDestroy()
{
  GetComponent(BeeControllerScript).m_ControlEnabled = true;
  GetComponent(NetworkInputScript).m_ControlEnabled = true;
}

function SetLifetime(time : float)
{
	m_Lifetime = time;
}

function EnableNetworkInput(enabled : boolean)
{
	GetComponent(NetworkInputScript).m_ControlEnabled = enabled;
}