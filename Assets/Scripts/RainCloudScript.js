#pragma strict

var m_ShadowInstance : GameObject = null;
private var m_FirstColl : boolean = true;
function Awake () {
	
	
	var go : GameObject = gameObject.Instantiate(m_ShadowInstance);
	//go.transform.position = transform.position;
	//go.transform.position = transform.position ;
	go.transform.parent = transform;
	go.transform.position = transform.position ;
	go.transform.position.z -= 22;
	go.transform.localScale.x = 1.24;
	
}

function Update () {

}

function OnTriggerEnter()
{
Camera.main.GetComponent(CameraScript).Shake(0.25, 0.5);
}

function OnTriggerStay(other : Collider)
{
	if(other.gameObject.tag == "Player" )
	{
		m_FirstColl = false;
		other.GetComponent(UpdateScript).m_Vel += (other.transform.position - (transform.position - GetComponent(BoxCollider).center)) * Time.deltaTime *10;
		//other.GetComponent(UpdateScript).m_Vel *= -1;
		//Camera.main.GetComponent(CameraScript).Shake(0.25, 0.5);
	}
}