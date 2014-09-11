#pragma strict

public class NetworkUtils
{
	public static function IsControlledGameObject(go:GameObject ):boolean 
	{
		
		if((Network.isServer && GameObject.Find("GameServer").GetComponent(ServerScript).GetGameObject() == go) ||
			(Network.isClient && GameObject.Find("GameClient").GetComponent(ClientScript).GetGameObject() == go))
		{
			return true;
		}
		return false;
	}
	
	public static function GetNumClients():int
	{
		if(Network.isServer)
			return GameObject.Find("GameServer").GetComponent(ServerScript).GetNumClients();
		return GameObject.Find("GameClient").GetComponent(ClientScript).GetNumClients();
			
	}
	
	public static function GetClientObject(index:int) : GameObject 
	{
		if(Network.isServer )
			return	GameObject.Find("GameServer").GetComponent(ServerScript).GetClient(index).m_GameObject;
			
		return GameObject.Find("GameClient").GetComponent(ClientScript).GetClient(index).m_GameObject;
	}
	
	public static function GetClientFromGameObject(go:GameObject):int
	{
		for(var i:int = 0; i < GetNumClients(); i++)
		{
			if(go == GetClientObject(i))
				return i;
		}
		return -1;
	}
}