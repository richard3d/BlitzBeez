#pragma strict
var m_Eyes:Texture2D[];
var m_Mouths:Texture2D[];

var m_EyeIndex:int = 0;
var m_MouthIndex:int = 0;
function Start () {
		Blink();
}

function Update () {

}

function Blink()
{
	var bee:GameObject = transform.GetChild(0).Find("NewBee/NewBee").gameObject;
	while(true)
	{
		yield WaitForSeconds(0.066);
		bee.GetComponent.<Renderer>().materials[2].mainTextureScale = Vector2(1,8);
		bee.GetComponent.<Renderer>().materials[2].mainTextureOffset = Vector2(0,-2);
		yield WaitForSeconds(0.066);
		bee.GetComponent.<Renderer>().materials[2].mainTextureScale = Vector2(1,1);
		bee.GetComponent.<Renderer>().materials[2].mainTextureOffset = Vector2(0,0);
		yield WaitForSeconds(Random.Range(0.5, 2));
	}
}

function SetLookIndexes(eye:int, mouth:int)
{
	m_EyeIndex = eye;
	m_MouthIndex = mouth;
	var bee:GameObject = transform.GetChild(0).Find("NewBee/NewBee").gameObject;
	bee.GetComponent.<Renderer>().materials[2].mainTexture = m_Eyes[m_EyeIndex%3];
	bee.GetComponent.<Renderer>().materials[3].mainTexture = m_Mouths[m_MouthIndex%3];
}

function SetLook()
{
	m_EyeIndex++;
	if(m_EyeIndex %3 == 0)
		m_MouthIndex++;
	var index:int = (Random.Range(0, m_Eyes.length-1)+0.5);
	var bee:GameObject = transform.GetChild(0).Find("NewBee/NewBee").gameObject;
	bee.GetComponent.<Renderer>().materials[2].mainTexture = m_Eyes[m_EyeIndex%3];
	bee.GetComponent.<Renderer>().materials[3].mainTexture = m_Mouths[m_MouthIndex%3];
}

function SetRandomLook()
{
	m_EyeIndex = Random.Range(0,m_Eyes.length);
	m_MouthIndex = Random.Range(0,m_Mouths.length);
	if(m_EyeIndex %3 == 0)
		m_MouthIndex++;
	var index:int = (Random.Range(0, m_Eyes.length-1)+0.5);
	var bee:GameObject = transform.GetChild(0).Find("NewBee/NewBee").gameObject;
	bee.GetComponent.<Renderer>().materials[2].mainTexture = m_Eyes[m_EyeIndex%3];
	bee.GetComponent.<Renderer>().materials[3].mainTexture = m_Mouths[m_MouthIndex%3];
}