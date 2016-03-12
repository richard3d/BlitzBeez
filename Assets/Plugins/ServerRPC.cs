using UnityEngine;
using System.Collections;
using System.Collections.Generic;



public class BufferedRPC
{
	public string func;
	public RPCMode mode;
	public object[] args;
	public NetworkView view;
}

public class ServerRPC
{
	
	public static BufferedRPC [] m_RPCs;
	
	
	public static void Buffer(NetworkView view, string func, RPCMode mode, params object[] args) 
	{
		//first fix up the mode so no one accidentally passes in a buffered mode
		if(mode == RPCMode.AllBuffered)
			mode = RPCMode.All;
		else if(mode  == RPCMode.OthersBuffered)
			mode = RPCMode.Others;
			
		if(m_RPCs == null)
			m_RPCs = new BufferedRPC[0];
		BufferedRPC [] temp = new BufferedRPC[m_RPCs.Length+1];
		if(m_RPCs.Length > 0)
			m_RPCs.CopyTo(temp,0);
		
		BufferedRPC tempRPC = new BufferedRPC();
		tempRPC.func = func;
		tempRPC.mode = mode;
		if(args != null)
		{
			// for(int i = 0; i < args.Length; i++)
				// Debug.Log(args[i].ToString() + ", ");
			tempRPC.args = new object[args.Length];
			args.CopyTo(tempRPC.args,0);
		}
		tempRPC.view = view;
		temp[temp.Length-1] = tempRPC;
		m_RPCs = temp;
		
		view.RPC(func, mode, args);
	}
	
	public static void ExecuteBuffer(  NetworkPlayer target)
	{
		if(m_RPCs == null)
			return;
		for(int i = 0; i < m_RPCs.Length; i++)
		{
			m_RPCs[i].view.RPC(m_RPCs[i].func, target, m_RPCs[i].args);
		}
	}
	
	public static void DeleteFromBuffer(NetworkView view)
	{
		List<BufferedRPC> rpcs = new List<BufferedRPC>(m_RPCs);
		
		for(int i = 0 ; i < rpcs.Count;)
		{ 
			if( rpcs[i].view == view)
			{
				//Debug.Log("Removing RPC:" + " "+rpcs[i].func);
				rpcs.RemoveAt(i);
				continue;
			}
			i++;
		}
		
		m_RPCs = new BufferedRPC[rpcs.Count];
		for(int i = 0; i < rpcs.Count; i++)
		{
			m_RPCs[i] = rpcs[i];
		}
	}
	
	public static void DeleteFromBuffer(int group)
	{
		List<BufferedRPC> rpcs = new List<BufferedRPC>(m_RPCs);
		
		for(int i = 0 ; i < rpcs.Count;)
		{ 
			if( rpcs[i].view != null && rpcs[i].view.group == group )
			{
				//Debug.Log("Removing RPC:"+  " "+rpcs[i].func);
				rpcs.RemoveAt(i);
				continue;
			}
			i++;
		}
		
		m_RPCs = new BufferedRPC[rpcs.Count];
		for(int i = 0; i < rpcs.Count; i++)
		{
			m_RPCs[i] = rpcs[i];
		}
	}
	
	public static void DeleteFromBuffer(GameObject go)
	{
		List<BufferedRPC> rpcs = new List<BufferedRPC>(m_RPCs);
		
		for(int i = 0 ; i < rpcs.Count; )
		{   
			//if(rpcs[i].view != null )
			//	Debug.Log(i);
			if( rpcs[i].view == null || rpcs[i].view.gameObject.name == go.name)
			{
			//	Debug.Log("Removing "+go.name + " " +rpcs[i].func);
				rpcs.RemoveAt(i);
				continue;
			}
			else
			{
				bool found = false;
				for (int k = 0 ; k < rpcs[i].args.Length; k++)
				{
					if(rpcs[i].args[k].ToString().IndexOf(go.name) > -1 || (go.GetComponent("NetworkView")!= null && go.GetComponent<NetworkView>().viewID.ToString() == rpcs[i].args[k].ToString()))
					{
					//	Debug.Log("Removing "+go.name + " " + rpcs[i].args[k].ToString() + " "+rpcs[i].func);
						rpcs.RemoveAt(i);
						found = true;
						break;
					}
				}
				if(found)
					continue;
			}
			i++;
		}
		
		m_RPCs = new BufferedRPC[rpcs.Count];
		for(int i = 0; i < rpcs.Count; i++)
		{
			m_RPCs[i] = rpcs[i];
		}

	}
	
	public static void ClearBuffer()
	{
		m_RPCs = null;
	}
	
	//execute items from the buffer from a certain group number
	public static void ExecuteBuffer(  NetworkPlayer target, int group)
	{
		if(m_RPCs == null)
			return;
		//Debug.Log("Executing Buffered RPC group: "+group);
		for(int i = 0; i < m_RPCs.Length; i++)
		{
			if(m_RPCs[i].view != null && m_RPCs[i].view.group == group)
			{
				// bool bValidArgs = true;
				// if(m_RPCs[i].func == "MakeGameObjectLive" ||
				   // m_RPCs[i].func == "MakeGameObjectLive2")
				// {
					// if(NetworkView.Find((NetworkViewID)m_RPCs[i].args[1]) == null)
					// {
						// Debug.Log("args are false");
						// bValidArgs = false;
					// }
				// }				   
				
				// if(bValidArgs)
					m_RPCs[i].view.RPC(m_RPCs[i].func,target, m_RPCs[i].args);
			}
		}
	}
	

}


